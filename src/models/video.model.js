import mongoose, { mongo } from "mongoose";

const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String, // Cloudinary URL
            required: true
        },
        thumbnail: {
            type: String,  // Cloudinary URL
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            required: true
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: mongoose.Schema.Types.objectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
)

export const Video = mongoose.model('Video', videoSchema);