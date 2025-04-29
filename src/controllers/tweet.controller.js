import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content || content.trim() === '') {
        throw new ApiError(400, 'Tweet content cannot be empty.');
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'User authentication required to create a tweet.');
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(201, tweet, 'Tweet created successfully.')
    );
});


const getUserTweets = asyncHandler(async (req, res) => {
    // Get all tweets created by the logged-in user
    const loggedInUserTweets = await Tweet.find({ owner: req.user?._id })

    if (!loggedInUserTweets || loggedInUserTweets.length === 0) {
        throw new ApiError(404, 'No tweets found for this user')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, loggedInUserTweets, 'User tweets fetch successfully')
        )
});


const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    // console.log(tweetId);
    // console.log(content);

    if (!tweetId || !content) {
        throw new ApiError(400, 'Tweet ID and content are required to update a tweet');
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { content },
        { new: true }
    );

    if (!tweet) {
        throw new ApiError(404, 'Tweet not found for the given ID');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, 'Tweet updated successfully')
        );
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    // console.log(tweetId);

    if (!tweetId) {
        throw new ApiError(400, 'Tweet ID is required to delete a tweet');
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if (!tweet) {
        throw new ApiError(404, 'Tweet not found or already deleted');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Tweet deleted successfully')
        );
});


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}