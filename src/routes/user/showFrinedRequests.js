import {Router} from "express";
import User from "../../models/User.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";

const router = Router();

// GET /api/friendrequests - Get the authenticated user's incoming friend requests
router.get(
  "/api/friendrequests",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    // The friend request IDs are on the authenticated user object
    const friendRequestIds = req.user.friendRequests;

    // If there are no friend requests, return an empty array.
    // This is better than a 404, as an empty list is a valid state.
    if (!friendRequestIds || friendRequestIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No pending friend requests.",
        data: [],
      });
    }

    // Fetch the user documents for each friend request ID
    const usersRequesting = await User.find({
      _id: { $in: friendRequestIds },
    }).select("_id username profilePicture");

    return res.status(200).json({
      success: true,
      message: "Friend requests retrieved successfully.",
      data: usersRequesting,
    });
  })
);

export default router;
