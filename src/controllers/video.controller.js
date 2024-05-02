import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    unlinkFromCloudinary,
    uploadOnCloudinary,
    uploadVideoOnCloudinary,
} from "../utils/cloudinary.js";



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortType = 'asc', userId, search = '' } = req.query;

    const sort = {};

    if (sortBy) {
        sort[sortBy] = sortType
    }

    const options = {
        page,
        limit,
        sort,
    }

    const pipeline = [
        {
            "$match": {
                "isPublished": true
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "owner",
                "foreignField": "_id",
                "as": "channelDetails"
            }
        },
        {
            "$addFields": {
                "owner": { "$arrayElemAt": ["$channelDetails", 0] }
            }
        },
        {
            "$match": {
                "$or": [
                    {
                        "title": { "$regex": `${search}`, "$options": "i" }
                    },
                    {
                        "description": { "$regex": `${search}`, "$options": "i" }
                    },
                    {
                        "owner.username": { "$regex": `${search}`, "$options": "i" }
                    },
                    {
                        "owner.fullName": { "$regex": `${search}`, "$options": "i" }
                    }
                ]
            }
        },
        {
            "$project": {
                "channelDetails": 0,
                "owner.password": 0,
                "owner.refreshToken": 0
            }
        }
    ];

    const videoAggregate = await Video.aggregate(pipeline);
    return res
        .status(200)
        .json(new ApiResponse(200, videoAggregate, "All videos fetched successfulyy"));

});

// Publish new video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if ([title, description].some((field) => field?.trim === "")) {
        throw new ApiError(400, "All Fields are required");
    }

    const videoLocalPath =
        req.files?.videoFile !== undefined ? req.files?.videoFile[0].path : null;
    const thumbnailLocalPath =
        req.files?.thumbnail !== undefined ? req.files?.thumbnail[0].path : null;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "video or thumbnail file is missing");
    }

    const videoCloudinary = await uploadVideoOnCloudinary(videoLocalPath);
    if (!videoCloudinary) {
        throw new ApiError(500, "Something went wrong while uploading video ");
    }

    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailCloudinary) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail");
    }

    const video = await Video.create({
        title,
        description,
        thumbnail: thumbnailCloudinary.url,
        videoFile: videoCloudinary.url,
        duration: videoCloudinary.duration,
        owner: req.user?._id,
    });

    const createdVideo = await Video.findById(video._id);

    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while registering video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, createdVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Invalid video Id");
    }


    const video = await Video.aggregate([
        {
            "$match": {
                "_id": new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "owner",
                "foreignField": "_id",
                "as": "ownerDetails"
            }
        },
        {
            "$addFields": {
                "owner": { "$arrayElemAt": ["$ownerDetails", 0] }
            }
        },
        {
            "$lookup": {
                "from": "comments",
                "localField": "_id",
                "foreignField": "video",
                "as": "comments"
            }
        },
        {
            "$lookup": {
                "from": "likes",
                "localField": "_id",
                "foreignField": "video",
                "as": "likes"
            }
        },
        {
            "$addFields": {
                "likesCount": { "$size": "$likes" },
                "liked": {
                    "$cond": {
                        "if": { "$gt": [{ "$size": "$likes" }, 0] },
                        "then": {
                            "$eq": [
                                {
                                    "$size":
                                    {
                                        "$filter":
                                        {
                                            "input": "$likes",
                                            "cond": {
                                                "$eq": ["$$this.likedBy", new mongoose.Types.ObjectId(req.user?._id)]
                                            }
                                        }
                                    }
                                },
                                1
                            ]
                        },
                        "else": false
                    }
                }
            }
        },
        {
            "$lookup": {
                "from": "subscriptions",
                "localField": "owner._id",
                "foreignField": "channel",
                "as": "subscribers"
            }
        },
        {
            "$addFields": {
                "isUserSubscriberOfChannel": {
                    "$cond": {
                        "if": { "$gt": [{ "$size": "$subscribers" }, 0] },
                        "then": {
                            "$gt": [
                                {
                                    "$size": {
                                        "$filter": {
                                            "input": "$subscribers",
                                            "cond": { "$eq": ["$$this.subscriber", new mongoose.Types.ObjectId(req.user?._id)] }
                                        }
                                    }
                                },
                                0
                            ]
                        },
                        "else": false
                    }
                }
            }
        },
        {
            "$project": {
                "owner.password": 0,
                "owner.coverImage": 0,
                "owner.watchHistory": 0,
                "ownerDetails": 0,
                "likes": 0,
            }
        }
    ]
    );


    if (!video) {
        throw new ApiError(404, "Video resources not found or invalide video Id");
    }


    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!title || !description || !thumbnailLocalPath) {
        throw new ApiError(400, "All fields are required");
    }

    const video = await Video.findById(videoId);

    if (video?.thumbnail) {
        const res = await unlinkFromCloudinary(video?.thumbnail);
        if (!res) {
            throw new ApiError(500, "Something went wrong while unlinking old data");
        }
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url,
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updateVideo, "Video details updated successfully")
        );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (video.thumbnail) {
        const res = await unlinkFromCloudinary(video.thumbnail);
    }
    if (video.videoFile) {
        const res = await unlinkFromCloudinary(video.videoFile, "video");
    }

    const isDeleted = await Video.findByIdAndDelete(videoId);

    if (!isDeleted) {
        throw new ApiError(500, "Something went wrong while deleting video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Find the video by its ID
    const video = await Video.findById(videoId);

    // Toggle the isPublished field
    video.isPublished = !video.isPublished;

    // Save the updated video
    const updatedVideo = await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, updateVideo, "Video status updated"));
});

const getVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const sort = {};

    if (sortBy) {
        sort[sortBy] = sortType
    }


    const options = {
        page,
        limit,
        sort,
        populate: "owner",
        options: { owner: userId }
    }

    const videos = await Video.paginate({
        owner: {
            $eq: new mongoose.Types.ObjectId(userId)
        }
    }, options);

    return res.status(200).json(new ApiResponse(200, videos, 'fetched'));
})

const updateVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const updatedVideo = await Video.findByIdAndUpdate(videoId, { $inc: { "views": 1 } }, { new: true })

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "view added to video"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getVideos,
    updateVideoViews
};
