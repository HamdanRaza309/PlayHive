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

export const loginUser = asyncHandler(async (req, res) => {
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

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(
            new ApiResponse(200, {}, 'User Logged Out successfully')
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingToken = req.body.refreshToken || req.cookies.refreshToken

    if (!incommingToken) {
        throw new ApiError(401, 'Refresh Token is not found')
    }

    try {
        const decodedToken = jwt.verify(incommingToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(401, 'Invalid Refresh Token')
        }

        if (incommingToken !== user?.refreshToken) {
            throw new ApiError(401, 'Invalid Refresh Token or used')
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    'Access Token refreshed successfully'
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refreshToken')
    }
})

const getUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username.trim()) {
        throw new ApiError(400, 'Username is missing')
    }

    // finding the count of subscribers of the channel(user) and the count of the channels this user(channel) has subscribed to.
    const channel = await User.aggregate([
        {
            // finding the user with the given username
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            // finding subscribers of this channel
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers'
            }
        },
        {
            // finding the count of channels this user has subscribed to
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'subscriber',
                as: 'subscribedTo'
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: '$subscribers'
                },
                channelsSubscribedToCount: {
                    $size: '$subscribedTo'
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user._id, '$subscribers.subscriber'] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // the fields that you want to send to the frontend
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                isSubscribed: 1,
                email: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, 'Channel does not exists')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], 'User Profile fetched successfully')
        )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, getUserProfile }