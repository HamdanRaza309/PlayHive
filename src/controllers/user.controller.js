import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadFileOnCloudinary } from '../utils/cloudinary.js'

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, username, email, password } = req.body
    console.log(email, password, username, fullname);

    // throws error if any field is empty
    if (
        [fullname, username, email, password].some((field) =>
            field.trim() === ''
        )
    ) {
        throw new ApiError(400, 'All fields are required.')
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with same email or username already exists.");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is required');
    }

    const avatar = await uploadFileOnCloudinary(avatarLocalPath);
    const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, 'Avatar file is required');
    }

    const user = await User.create({
        fullname,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findOne(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while creating a user.')
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User regitered successfully.')
    )
})

export { registerUser }
