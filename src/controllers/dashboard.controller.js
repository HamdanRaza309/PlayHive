import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { populate } from "dotenv"

// TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, 'You must be logged in');
    }

    // Count of subscribers
    const channelSubscribers = await Subscription.countDocuments({ channel: userId });

    // Count of channels the user is subscribed to
    const channelSubscribedTo = await Subscription.countDocuments({ subscriber: userId });

    // Count of videos uploaded by the channel
    const channelTotalVideos = await Video.countDocuments({ owner: userId });

    // Total likes on all videos
    const likesAggregation = await Like.aggregate([
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: 'videoDetails'
            }
        },
        { $unwind: '$videoDetails' },
        {
            $match: {
                'videoDetails.owner': new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 }
            }
        }
    ]);

    const channelTotalLikesOnAllVideos = likesAggregation[0]?.totalLikes || 0;

    // Total views on all videos
    const viewsAggregation = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$views' }
            }
        }
    ]);

    const channelTotalViewsOnAllVideos = viewsAggregation[0]?.totalViews || 0;


    const channelStats = {
        channelSubscribers,
        channelSubscribedTo,
        channelTotalVideos,
        channelTotalLikesOnAllVideos,
        channelTotalViewsOnAllVideos
    };

    return res
        .status(200)
        .json(new ApiResponse(200, channelStats, 'Channel stats retrieved successfully'));
});

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