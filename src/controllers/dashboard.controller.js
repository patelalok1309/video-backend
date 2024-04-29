import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const { channelId } = req.params;

    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "channelDetails",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$channelDetails",
                },
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likesDetails",
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likesDetails",
                },
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "commentsDetails",
            },
        },
        {
            $addFields: {
                commentsCount: {
                    $size: "$commentsDetails",
                },
            },
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views",
                },
                totalLikes: {
                    $sum: "$likesCount",
                },
                totalComments: {
                    $sum: "$commentsCount",
                },
                totalDuration: {
                    $sum: "$duration",
                },
                totalSubscribers: {
                    $sum: "$subscribersCount",
                },
                totalVideos: {
                    $sum: 1,
                },
            },
        },
        {
            $addFields: {
                Subscribers: {
                    $divide: [
                        "$totalSubscribers",
                        "$totalVideos",
                    ],
                },
            },
        },
        {
            $project: {
                Subscribers: 1,
                totalViews: 1,
                totalComments: 1,
                totalLikes: 1,
                totalDuration: 1,
                totalVideos: 1,
            },
        },
    ]

    const channelStats = await Video.aggregate(pipeline);

    return res.status(200).json(new ApiResponse(200, channelStats, "channelStats fetched successfully"))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params;

    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        }
    ]

    const videos = await Video.aggregate(pipeline);

    return res.status(200).json(new ApiResponse(200, videos, "videos fetched successfully"));
})

export {
    getChannelStats,
    getChannelVideos
}