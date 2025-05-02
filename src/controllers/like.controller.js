import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"
import { Video } from "../models/video.model.js"

// Toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId || !userId) {
        throw new ApiError(400, 'Video ID and User ID are required');
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, {}, "Video unliked"));
    }

    await Like.create({ video: videoId, likedBy: userId });
    return res.status(201).json(new ApiResponse(201, {}, "Video liked"));
});

// Toggle like on a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!commentId || !userId) {
        throw new ApiError(400, "Comment ID and User ID are required");
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, {}, "Comment unliked successfully")
        );
    }

    await Like.create({
        comment: commentId,
        likedBy: userId
    });

    return res.status(201).json(
        new ApiResponse(201, {}, "Comment liked successfully")
    );
});

// Toggle like on a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user?._id;

    if (!tweetId || !userId) {
        throw new ApiError(400, "Tweet ID and User ID are required");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, {}, "Tweet unliked successfully")
        );
    }

    await Like.create({
        tweet: tweetId,
        likedBy: userId
    });

    return res.status(201).json(
        new ApiResponse(201, {}, "Tweet liked successfully")
    );
});

//TODO: get all liked videos by logged-in user
const getLikedVideos = asyncHandler(async (req, res) => {

});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}