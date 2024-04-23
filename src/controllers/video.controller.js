import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { unlinkFromCloudinary, uploadOnCloudinary, uploadVideoOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if ([title, description].some(field => field?.trim === "")) {
        throw new ApiError(400, "All Fields are required");
    }

    const videoLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is missing");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing");
    }

    const videoCloudinary = await uploadVideoOnCloudinary(videoLocalPath);
    if (!videoCloudinary) {
        throw new ApiError(500, "Something went wrong while uploading video ")
    }

    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailCloudinary) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail")
    }

    const video = await Video.create({
        title,
        description,
        thumbnail: thumbnailCloudinary.url,
        videoFile: videoCloudinary.url,
        duration: videoCloudinary.duration,
        owner: req.user?._id
    });


    const createdVideo = await Video.findById(video._id);

    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while registering video")
    }

    return res.status(200).json(new ApiResponse(200, createdVideo, "Video published successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Invalid video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video resources not found or invalide video Id");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched Successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path

    if (!title || !description || !thumbnailLocalPath) {
        throw new ApiError(400, "All fields are required");
    }

    const video = await Video.findById(videoId)

    if (video.thumbnail) {
        const res = await unlinkFromCloudinary(video.thumbnail);
        if (!res) {
            throw new ApiError(500, "Something went wrong while unlinking old data")
        }
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail.url) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updateVideo, "Video details updated successfully"));
})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (video.thumbnail) {
        const res = await unlinkFromCloudinary(video.thumbnail);
        console.log(res);
    }
    if (video.videoFile) {
        const res = await unlinkFromCloudinary(video.videoFile, 'video');
        console.log(res);
    }

    const isDeleted = await Video.findByIdAndDelete(videoId);

    if(!isDeleted){
        throw new ApiError(500 , "Something went wrong while deleting video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200 , {} , "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}