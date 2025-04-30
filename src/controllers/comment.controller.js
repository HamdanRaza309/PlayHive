import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //  apply this -> const { page = 1, limit = 10 } = req.query

    if (!videoId) {
        throw new ApiError(400, 'Video ID is required.');
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'User must be logged in to view comments.');
    }

    // const comments = await Comment.find({ video: videoId }).populate('owner', 'username');

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'ownerDetails',
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                ownerDetails: {
                    $first: '$ownerDetails'
                }
            }
        }
    ])

    if (!comments || comments.length === 0) {
        throw new ApiError(404, 'No comments found for this video.');
    }

    return res.status(200).json(
        new ApiResponse(200, comments, 'Comments fetched successfully.')
    );
});


const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!videoId || !content?.trim()) {
        throw new ApiError(400, 'Video ID and comment content are required.');
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'User must be logged in to add a comment.');
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    });

    if (!comment) {
        throw new ApiError(500, 'Failed to create comment. Please try again.');
    }

    return res.status(201).json(
        new ApiResponse(201, comment, 'Comment added successfully.')
    );
});


const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId || !content?.trim()) {
        throw new ApiError(400, 'Comment ID and updated content are required.');
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'User must be logged in to update a comment.');
    }

    const comment = await Comment.findOne({ _id: commentId, owner: req.user._id });

    if (!comment) {
        throw new ApiError(403, 'You are not authorized to update this comment.');
    }

    comment.content = content.trim();
    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, comment, 'Comment updated successfully.')
    );
});


const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, 'Comment ID is required.');
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'User must be logged in to delete a comment.');
    }

    const comment = await Comment.findOneAndDelete({ _id: commentId, owner: req.user._id });

    if (!comment) {
        throw new ApiError(403, 'You are not authorized to delete this comment or it does not exist.');
    }

    return res.status(200).json(
        new ApiResponse(200, {}, 'Comment deleted successfully.')
    );
});


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}