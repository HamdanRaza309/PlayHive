import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadFileOnCloudinary } from '../utils/cloudinary.js'
import jwt from 'jsonwebtoken'

// Generating access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        // Await the token generation
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong , while generating refresh ans access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, username, email, password } = req.body
    // console.log(email, password, username, fullname);

    // throws error if any field is empty
    if (
        [fullname, username, email, password].some((field) =>
            field.trim() === ''
        )
    ) {
        throw new ApiError(400, 'All fields are required.')
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with same email or username already exists.");
    }

    // console.log(req.files);

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

const loginUser = asyncHandler(async (req, res) => {
    // take data from req.body
    // username || email validation
    // find user
    // password check
    // access token adn refresh token
    // send cookie in response

    const { username, email, password } = req.body;
    console.log('req.body', req.body);
    console.log(req.headers['content-type']);


    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    // console.log('password', password);

    if (!user) {
        throw new ApiError(404, 'User does not exist')
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid user credentials')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

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
                { user: loggedInUser, accessToken, refreshToken },
                "User Logged in successfully"
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

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id) // req.user?.id

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, 'Invalid Password')
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Password changed successfully')
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, 'User fetched successfully')
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email, fullname } = req.body;

    if (!email || !fullname) {
        throw new ApiError(400, 'All fields are required')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                email,
                fullname
            }
        },
        {
            new: true
        }
    ).select('-password')

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'Account details updated successfully')
        )

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is missing')
    }

    const avatar = await uploadFileOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, 'Error while uploading avatar file')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select('-password')

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'User Avatar is updated successfully')
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, 'Cover Image file is missing')
    }

    const coverImage = await uploadFileOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, 'Error while uploading Cover Image file')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select('-password')

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'User Cover Image is updated successfully')
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile }