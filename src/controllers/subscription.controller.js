import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const isUserSubscribed = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id")
    }

    const subscription = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    });

    if (!subscription || subscription.length == 0) {
        return res.status(200).json(new ApiResponse(200, false, 'User is not subscriber of the channel'))
    }
    return res.status(200).json(new ApiResponse(200, true, 'User is subscriber of the channel'))

})


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id");
    }

    const subscription = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    });

    if (!subscription || subscription.length == 0) {
        const newSubscription = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })
        return res.status(200).json(new ApiResponse(200, { subscribed: true, newSubscription }, 'subscribed successfully'))
    }

    const deleteRes = await Subscription.findByIdAndDelete(subscription._id);
    return res.status(200).json(new ApiResponse(200, { subscribed: false, deleteRes }, 'un-subscribed successfully'))

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    const subscribers = await Subscription.aggregate(
        [
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $addFields: {
                    subscriber: {
                        $arrayElemAt: ['$userDetails', 0]
                    }
                }
            },
            {
                $project: {
                    "subscriber.password": 0,
                    channel: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    userDetails: 0,
                    __v: 0
                }
            }
        ]
    );

    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers list fetched successfully"));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalide subscriber Id");
    }

    const channels = await Subscription.aggregate(
        [
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channels"
                }
            },
            {
                $addFields: {
                    channel: {
                        $arrayElemAt: ['$channels', 0]
                    }
                }
            },
            {
                $project: {
                    "channel.password": 0,
                    "channel.refreshToken": 0
                }
            },
            {
                $project: {
                    "channel": 1
                }
            }
        ]
    )

    return res
        .status(200)
        .json(new ApiResponse(200, channels, "subscribed channels fetched successfully"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    isUserSubscribed
}