import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'

const generateAndAccessRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) throw new ApiError(404, 'User not found')

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { refreshToken, accessToken }
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while generating or accessing refresh token.')
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, username, email, password } = req.body

    if (!username || !email) {
        throw new ApiError(400, 'Username or email is required.')

        const user = await User.findOne({
            $or: [{ username }, { email }]
        })
        if (!user) {
            throw new ApiError(404, 'User does not exist.')
        }

        const isPasswordValid = await user.isPasswordCorrect(password)
        if (!isPasswordValid) {
            throw new ApiError(404, 'Invalid user credentials.')
        }

        const { accessToken, refreshToken } = await generateAndAccessRefreshToken(user._id)
        res.status(200).json(new ApiResponse(true, 'User logged in successfully.', { accessToken, refreshToken })) // Added response for API consistency
    })

export { registerUser }
