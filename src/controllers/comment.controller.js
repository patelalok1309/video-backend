import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

})

const addComment = asyncHandler(async (req, res) => {
    const { content, videoId } = req.body;

    if ([content, videoId].some(field => field.trim === "")) {
        throw new ApiError(400, "content or video id is missing!")
    }

    const newComment = await Comment.create({
        content,
        video: new mongoose.Types.ObjectId(videoId),
        owner: req.user?._id
    });

    if (!newComment) {
        throw new ApiError(500, "something went wrong while creating new comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newComment, "comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { content, commentId } = req.body;

    if ([content, commentId].some(field => field.trim === "")) {
        throw new ApiError(400, "content or video id is missing!")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        new mongoose.Types.ObjectId(commentId),
        { content },
        { new: true }
    )

    if (!updateComment) {
        throw new ApiError(404, "comment not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.body;

    const res = await Comment.findByIdAndDelete(
        commentId,
    )

    if (!res) {
        throw new ApiError(404, "comment not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, res, "Comment deleted successfully"))

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
