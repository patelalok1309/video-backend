import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    const createdPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    });

    if (!createdPlaylist) {
        throw new ApiError(500, "Something went wrong while creating Playlist");
    }

    return res.status(201)
        .json(new ApiResponse(201, createdPlaylist, "Playlist created successfully"));

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalide userId")
    }

    const playlists = await Playlist.find({ owner: userId })

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists fetched successfully"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalide Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalide playlist id")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalide video id")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, 'Video added to playlist successfully'));
})



const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalide playlist id")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalide video id")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, 'Video added to playlist successfully'));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    await Playlist.findByIdAndDelete(playlistId)

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Playlist deleted successfully'));

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(400, "All fields are required to update");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name,
            description
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
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