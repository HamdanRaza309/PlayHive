import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadFileOnCloudinary } from "../utils/cloudinary.js"
import { v2 as cloudinary } from 'cloudinary';

export const extractPublicId = (url) => {
    try {
        const parsedUrl = new URL(url);
        const pathSegments = parsedUrl.pathname.split('/');

        // Find the version part like 'v1693224678' and slice everything after it
        const versionIndex = pathSegments.findIndex(segment => /^v\d+$/.test(segment));
        const relevantPath = pathSegments.slice(versionIndex + 1).join('/');

        // Remove the file extension (e.g., .jpg, .png)
        const lastDotIndex = relevantPath.lastIndexOf('.');
        return relevantPath.substring(0, lastDotIndex); // e.g., folder/my-image
    } catch (err) {
        console.error("Error extracting public ID:", err.message);
        return null;
    }
};

//TODO: get all videos based on query, sort, pagination
// const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
const getAllVideos = asyncHandler(async (req, res) => {

    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const videos = await Video.find({ owner: userId }).populate('owner', 'username fullname');

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for this user");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});


// TODO: get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!title || !description || !videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "All fields are required (title, description, videoFile, thumbnail)");
    }

    const uploadedVideo = await uploadFileOnCloudinary(videoFileLocalPath);
    const uploadedThumbnail = await uploadFileOnCloudinary(thumbnailLocalPath);

    if (!uploadedVideo?.url || !uploadedThumbnail?.url) {
        throw new ApiError(500, "Video or thumbnail upload failed");
    }

    const publishedVideo = await Video.create({
        title,
        description,
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        owner: req.user?._id,
        views: 0,
        duration: uploadedVideo?.duration || 0,  // fallback to 0 if duration not available
        isPublished: false
    });

    return res.status(200).json(
        new ApiResponse(200, publishedVideo, 'Video published successfully')
    );
});

//TODO: get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID format");
    }

    // Find the video and optionally populate owner info
    const video = await Video.findById(videoId).populate("owner", "username email");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video fetched successfully")
        );
});

//TODO: update video details like title, description, thumbnail
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const thumbnailLocalPath = req.file?.path;

    // Handle thumbnail update (optional)
    if (thumbnailLocalPath) {
        // Delete old thumbnail from Cloudinary if it exists
        if (video.thumbnail) {
            const publicId = extractPublicId(video.thumbnail);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId, {
                        resource_type: 'image'
                    });
                } catch (error) {
                    console.error("Cloudinary deletion error:", error);
                }
            }
        }

        // Upload new thumbnail
        const uploadedThumbnail = await uploadFileOnCloudinary(thumbnailLocalPath);
        if (!uploadedThumbnail?.url) {
            throw new ApiError(500, "Failed to upload new thumbnail");
        }

        video.thumbnail = uploadedThumbnail.url;
    }

    // Update title and/or description
    if (title) video.title = title;
    if (description) video.description = description;

    // Check if at least one field is being updated
    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "No fields provided to update");
    }

    await video.save();

    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    );
});

//TODO: delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Optional: Delete the associated video and thumbnail from Cloudinary
    if (video.videoFile) {
        const videoPublicId = extractPublicId(video.videoFile);
        if (videoPublicId) {
            await cloudinary.uploader.destroy(videoPublicId, { resource_type: 'video' });
        }
    }

    if (video.thumbnail) {
        const thumbnailPublicId = extractPublicId(video.thumbnail);
        if (thumbnailPublicId) {
            await cloudinary.uploader.destroy(thumbnailPublicId, { resource_type: 'image' });
        }
    }

    const isVideoDeleted = await Video.findByIdAndDelete(videoId);

    if (!isVideoDeleted) {
        throw new ApiError(500, "Failed to delete the video");
    }

    // Optional: Update or delete the video references in user watch history
    await User.updateMany(
        { watchHistory: videoId }, // Find users who have this video in their watch history
        { $pull: { watchHistory: videoId } } // Remove the video from their watch history
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video deleted successfully")
        );
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, 'Video ID is required');
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    // Toggle the isPublished status
    video.isPublished = !video.isPublished;

    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, `Video publish status has been ${video.isPublished ? 'published' : 'unpublished'}`)
        );
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}