import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    console.log(videoId);
    const pipeline = {
        video: {
            $eq: new mongoose.Types.ObjectId(videoId)
        }
    };

    const options = {
        page,
        limit
    };

    const paginatedResult = await Comment.paginate(pipeline, options);

    return res.status(200).json(new ApiResponse(200, paginatedResult, "Comments on video fetched successfully"));
})


const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    console.log("content", content);
    console.log("videoId", videoId);
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

    const { content } = req.body;
    const { commentId } = req.params;

    console.log(content);
    console.log(commentId);


    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content
            }
        },
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

    const { commentId } = req.params;

    const deleteResponse = await Comment.findByIdAndDelete(
        commentId,
    )

    if (!deleteResponse) {
        throw new ApiError(404, "comment not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deleteResponse, "Comment deleted successfully"))

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
