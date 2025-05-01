import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


// TODO: toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;
    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    // Check if the subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    });

    if (existingSubscription) {
        // If already subscribed, unsubscribe (delete)
        await Subscription.deleteOne({ _id: existingSubscription._id });

        return res.status(200).json(
            new ApiResponse(200, {}, "Unsubscribed successfully")
        );
    } else {
        // If not subscribed, create new subscription
        await Subscription.create({
            subscriber: userId,
            channel: channelId
        });

        return res.status(200).json(
            new ApiResponse(200, {}, "Subscribed successfully")
        );
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    const userChannelSubscribers = await Subscription.find({ channel: channelId })
        .populate('subscriber', 'username fullname');

    if (!userChannelSubscribers || userChannelSubscribers.length === 0) {
        throw new ApiError(404, "No subscribers found for this channel");
    }

    return res.status(200).json(
        new ApiResponse(200, userChannelSubscribers, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!subscriberId) {
        throw new ApiError(400, "Subscriber ID is required");
    }

    const subscribedChannels = await Subscription.find({ subscriber: subscriberId })
        .populate('channel', 'username fullname');

    if (!subscribedChannels || subscribedChannels.length === 0) {
        throw new ApiError(404, "No subscribed channels found for this user");
    }

    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}