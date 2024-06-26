import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { unlinkFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken'
import mongoose, { isValidObjectId } from 'mongoose';
import { Video } from '../models/video.model.js';


// generate access and refresh tokens 
const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, 'Something went wrong while generating access and refresh tokens')
    }

}


// refresh access tokens 
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'unauthorized request')
    }

    try {

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired or used');
        }

        const options = {
            httpOnly: true,
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access token refreshed"
            ));
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong while refreshing access token")
    }
})


// Handle user registration 
const registerUser = asyncHandler(async (req, res) => {

    const { fullName, email, username, password } = req.body

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "" || field === undefined || field === null)
    ) {
        return res.status(400).json(new ApiError(400, "All fields are required"));
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        console.log("user exists");
        return res.status(400).json(new ApiError(400, "user with email or username already exists"));
    }

    let avatarLocalPath;
    if (req.files && Array.isArray(req.files?.avatar) && req.files?.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }

    if (!avatarLocalPath) {
        return res.status(200).json(new ApiError(400, "Avatar file is required"))
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files?.coverImage) && req.files?.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        return res.status(400).json(new ApiError(400, "Avatar file is required"))
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username?.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        return res.status(500).json(new ApiError(500, "Something went wrong while registering the user"));
    }
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered Successfully"))
})


// Handle user login, access token and refresh tokens 
const loginUser = asyncHandler(async (req, res) => {

    const { username, email, password } = req.body;
    if (!(username || email)) {
        return res.status(404).json(new ApiError(404, "username or email is required"));
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        return res.status(401).json(new ApiError(401, "Invalid username or User does not exist"));
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        return res.status(401).json(new ApiError(401, "Invalid user credentials"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(" -password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    refreshToken,
                    accessToken,
                    msg: "User Logged in successfully"
                },
            )
        )
})


// Handle Logout user , remove refresh tokens and cookies 
const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})


// Change password 
const changeCurrentUserPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword, confirmPassword } = req.body;

    console.log({ oldPassword, newPassword, confirmPassword });

    if (newPassword !== confirmPassword) {
        return res.status(400).json(new ApiError(400, "Password confirmation failed check password and confirm password"));
    }

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        return res.status(401).json(new ApiError(401, "incorrent password ! 😒"));
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res.status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully ! 😎"))
})


// Get current user 
const getCurrentUser = asyncHandler(async (req, res) => {

    if (!req.user) {
        return res
            .status(401)
            .json(new ApiError(401, "Unauthorized request"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fetched successfully"));
})


// Update account details
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        return res.status(400).json(new ApiError(400, "All fields are required"));
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true,
        }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))

})


// Update user avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        return res.status(500).json(new ApiError(500, "something went wrong ! try again"));
    }

    const user = await User.findById(req.user?._id);

    // delete existing user avatar from the cloudinary 
    const isDeleted = unlinkFromCloudinary(user.avatar);

    if (!isDeleted) {
        throw new ApiError(500, "something went wrong while deleting asset from cloudinary")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar?.url
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar updated successfully"))
})


// update cover Image of user
const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const user = await User.findById(req.user?._id);
    const isDeleted = user.coverImage ? unlinkFromCloudinary(user.coverImage) : true;

    if (!isDeleted) {
        throw new ApiError(500, "Something went wrong while deleting coverimage from cloudinary");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, updatedUser, "Coverimage updated successfully"))
})


// Channel profile aggregation pipelines
const getUserChannnelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params;

    if (!username?.trim) {
        throw new ApiError(400, "usernmae is missing")
    }

    // aggregation pipelines to find subscribers 
    const channel = await User.aggregate([
        //  Stage 1 : find document with the username provided in request params 
        {
            $match: {
                username: username?.toLowerCase()
            }
        },

        // Stage 2 : make a left outer join to subscriptions collection's channel field
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },

        // Stage 3 : make a left outer join to subscriptions collection's subscriber field
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "channelDetails"
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $let: {
                                    vars: {
                                        firstDetail: { $arrayElemAt: ["$channelDetails", 0] }
                                    },
                                    in: "$$firstDetail"
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            channelDetails: 0,
                            "owner.password": 0,
                        }
                    }
                ]
            }
        },

        // Stage 4 : Count the subscribers and channels and create new fields for them
        {
            $addFields: {
                subscibersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                },
                videosCount: {
                    $size: "$videos"
                }
            }
        },

        // Stage 5 : project on necessary fields 
        {
            $project: {
                fullName: 1,
                username: 1,
                subscibersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                videosCount: 1,
                videos: 1,
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "User channel fetched successfullly"))
})


// find watch histories for the users
const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        },
                    }
                ]
            },
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner",
                }
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully"));

})

const addToWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId || !isValidObjectId(videoId)) {
        return res.status(400).json(new ApiError(400, "video id is null or invalid"));
    }

    const video = await Video.findById(videoId);

    if (!video) {
        return res.status(404).json(new ApiError(404, "video not found"));
    }

    const updatedWatchHistory = await User.findByIdAndUpdate(
        req.user?._id,
        { $push: { watchHistory: { $each: [video], $slice: -10 } } },
        { new: true }
    )

    return res.status(200).json(new ApiResponse(200, updatedWatchHistory, "videos pushed to watch history"))
})


const clearWatchHistory = asyncHandler(async (req, res) => {

    const response = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                watchHistory: []
            }
        },
        { new: true }
    )

    if (!clearWatchHistory) {
        return res.status(500).json(new ApiError(500, "something went wrong while deleting history"));
    }

    return res.status(200).json(new ApiResponse(200, {}, "History deleted successfully"))
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannnelProfile,
    getWatchHistory,
    addToWatchHistory,
    clearWatchHistory,
};

