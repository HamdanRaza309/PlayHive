import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required.");
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: User not found.");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
    });

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    // const userId = req.user._id

    if (!userId) {
        throw new ApiError(400, "User ID is required.");
    }

    const userPlaylists = await Playlist.find({ owner: userId });

    if (!userPlaylists || userPlaylists.length === 0) {
        throw new ApiError(404, "No playlists found for this user.");
    }

    return res.status(200).json(
        new ApiResponse(200, userPlaylists, "User playlists fetched successfully.")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required.");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'videos',
                foreignField: '_id',
                as: 'videoDetails'
            }
        }
    ]);

    if (!playlist || playlist.length === 0) {
        throw new ApiError(404, "Playlist not found.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist[0], "Playlist fetched successfully.")
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }

    const isPlaylistDeleted = await Playlist.findByIdAndDelete(playlistId);

    if (!isPlaylistDeleted) {
        throw new ApiError(404, "Playlist not found or already deleted");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Playlist deleted successfully')
        );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!playlistId) {
        throw new ApiError(400, 'Playlist ID is required')
    }

    if (!name && !description) {
        throw new ApiError(400, 'At least one of name or description must be provided')
    }

    const updateData = {}

    if (name) updateData.name = name
    if (description) updateData.description = description

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        updateData,
        { new: true }
    )

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, 'Playlist updated successfully')
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}