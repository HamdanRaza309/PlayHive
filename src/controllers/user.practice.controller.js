import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadFileOnCloudinary } from "../utils/cloudinary.js"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generaterefreshToken()

        user.refreshToken = refreshToken

        user.save({
            validateBeforeSave: false
        })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong , while generating refresh ans access token")
    }
}

export const registerUser = asyncHandler(async (req, res) => {
    // take input
    // check if all input fields are present
    // check if user already exists
    // take avatar and coverImage from req.files and give its localPath to uploadToCloudinary func
    // create user and store it in db
    // send res with created user

    const { username, email, fullname, password } = req.body;

    // Check if all input fields are present
    if (
        [username, email, fullname, password].some((field) => field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const userExists = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (userExists) {
        throw new ApiError(400, "User with these credentials already exists");
    }


    // Handling avatar upload
    console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is required');
    }

    const avatar = await uploadFileOnCloudinary(avatarLocalPath);
    const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, 'Avatar file is required');
    }

    // Create user and store in DB
    const createdUser = await User.create({
        username,
        email,
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
    });

    if (!createdUser) {
        throw new ApiError(400, "User is not created");
    }

    const user = await User.findById(createdUser._id).select("-password -refreshToken");

    res.status(201).json(new ApiResponse(201, user, "User is successfully created"));
});



export const logInUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    if (
        [username, email, password].some((field) => {
            return field.trim() === ''
        })
    ) {
        throw new ApiError(400, 'All fields are required')
    }

    const user = await findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(400, 'Invalid credentials')
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(400, 'Invalid credentials')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const LoggedInUser = await User.findById(user._id).select('-password -refreshToken')

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: LoggedInUser, accessToken, refreshToken },
                'User logged in successfully'
            )
        )
})