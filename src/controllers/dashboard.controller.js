import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { populate } from "dotenv"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})

// TODO: Get all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, 'User must be logged-in');
    }

    const loggedInUserVideos = await Video.find({ owner: userId }).populate('owner', 'fullname avatar');

    if (!loggedInUserVideos || loggedInUserVideos.length === 0) {
        throw new ApiError(404, 'No videos found for this channel');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, loggedInUserVideos, 'Channel videos retrieved successfully'));
});


export {
    getChannelStats,
    getChannelVideos
}