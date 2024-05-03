import { Router } from "express";
import {
    addToWatchHistory,
    changeCurrentUserPassword,
    clearWatchHistory,
    getCurrentUser,
    getUserChannnelProfile,
    getWatchHistory,
    logOutUser,
    loginUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateCoverImage,
    updateUserAvatar
} from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);

router.route('/login').post(loginUser);


// secured routes 
// GET 
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route("/c/:username").get(verifyJWT, getUserChannnelProfile);
router.route('/history').get(verifyJWT, getWatchHistory);
router.route('/history').delete(verifyJWT, clearWatchHistory);
router.route('/history/:videoId').post(verifyJWT, addToWatchHistory)
// POST 
router.route('/logout').post(verifyJWT, logOutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-password').post(verifyJWT, changeCurrentUserPassword);

// PATCH 
router.route('/update-account').patch(verifyJWT, updateAccountDetails);
router.route('/avatar').patch(verifyJWT, upload.single('avatar'), updateUserAvatar);
router.route('/coverImage').patch(verifyJWT, upload.single('coverImage'), updateCoverImage);

export default router;