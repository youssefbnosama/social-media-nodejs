import express from "express";
import mongoose from "mongoose";
import User from "../../models/User.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";

const router = express.Router();

// POST /api/acceptrequest
router.post(
  "/api/acceptrequest",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    const userId = req.user._id;
    const { friendId, status } = req.body || {};

    if (!friendId || !mongoose.Types.ObjectId.isValid(friendId)) {
      return next(new AppError("Valid friendId is required", 400, true));
    }

    if (!status || !["accepted", "declined"].includes(status)) {
      return next(
        new AppError("status must be 'accepted' or 'declined'", 400, true)
      );
    }

    // Load both users
    const [user, friend] = await Promise.all([
      User.findById(userId).select("_id friends friendRequests requestsSent"),
      User.findById(friendId).select("_id friends friendRequests requestsSent"),
    ]);

    if (!friend) {
      return next(new AppError("User not found", 404, true));
    }

    // Ensure there is a pending request from friend -> user
    const hasIncoming = user.friendRequests?.some(
      (id) => id.toString() === friendId.toString()
    );

    if (!hasIncoming) {
      return next(new AppError("No pending request from this user", 400, true));
    }

    if (status === "accepted") {
      // Add each other as friends and clean pending arrays
      await Promise.all([
        // add friends both sides
        User.findByIdAndUpdate(userId, {
          $addToSet: { friends: friendId },
          $pull: { friendRequests: friendId },
        }),
        User.findByIdAndUpdate(friendId, {
          $addToSet: { friends: userId },
          $pull: { requestsSent: userId },
        }),
      ]);

      return res.status(200).json({
        success: true,
        message: "Friend request accepted",
      });
    }

    // Declined: just remove pending on both sides
    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { friendRequests: friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { requestsSent: userId } }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Friend request declined",
    });
  })
);

export default router;
