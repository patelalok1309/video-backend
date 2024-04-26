import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    isUserSubscribed,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .post(toggleSubscription);

router.route('/channels/:subscriberId').get(getSubscribedChannels)

router.route("/subscribed/c/:channelId").get(isUserSubscribed);


router.route("/u/:channelId").get(getUserChannelSubscribers);

export default router