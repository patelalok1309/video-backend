import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalide Video Id")
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalide User Id or user not loged in");
    }

    const like = await Like.findOneAndDelete(
        {
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: new mongoose.Types.ObjectId(req.user?._id)
        }
    )

    if (!like) {
        const newLike = await Like.create({
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: new mongoose.Types.ObjectId(req.user?._id)
        })

        if (!newLike) {
            throw new ApiError(500, "Something went wrong while adding like");
        }

        return res.status(200).json(new ApiResponse(200, newLike, "Liked video successfully"));
    }

    return res.status(200).json(new ApiResponse(200, like, "Unliked video successfully"));

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalide Video Id")
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalide User Id or user not loged in");
    }

    const comment = await Like.findOneAndDelete(
        {
            comment: new mongoose.Types.ObjectId(commentId),
            likedBy: new mongoose.Types.ObjectId(req.user?._id)
        }
    )

    if (!comment) {
        const newLike = await Like.create({
            comment: new mongoose.Types.ObjectId(commentId),
            likedBy: new mongoose.Types.ObjectId(req.user?._id)
        })

        if (!newLike) {
            throw new ApiError(500, "Something went wrong while adding like");
        }

        return res.status(200).json(200, newLike, "Liked comment successfully");
    }

    const response = await comment.remove()

    return res.status(200).json(200, response, "UnLiked comment successfully");

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalide tweet Id")
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalide User Id or user not loged in");
    }

    const tweet = await Like.findOneAndDelete(
        {
            tweet: new mongoose.Types.ObjectId(tweetId),
            likedBy: new mongoose.Types.ObjectId(req.user?._id)
        }
    )

    if (!tweet) {
        const newLike = await Like.create({
            tweet: new mongoose.Types.ObjectId(tweetId),
            likedBy: new mongoose.Types.ObjectId(req.user?._id)
        })

        if (!newLike) {
            throw new ApiError(500, "Something went wrong while adding like");
        }

        return res.status(200).json(200, newLike, "Liked tweet successfully");
    }

    const response = await tweet.remove()

    return res.status(200).json(200, response, "UnLiked tweet successfully");
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user?._id;
    
    const likedVideos = await Like.aggregate(
        [
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videos",
                },
            },
            {
                $addFields: {
                    video: {
                        $arrayElemAt: ["$videos", 0],
                    },
                },
            },
            {
                $project: {
                    video: 1,
                },
            },
        ]
    )

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}