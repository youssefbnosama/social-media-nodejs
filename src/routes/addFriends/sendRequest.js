import express from "express";
import mongoose from "mongoose";
import User from "../../models/User.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";

const router = express.Router();

// POST /api/sendrequest
router.post(
  "/api/sendrequest",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    const userId = req.user._id;
    const { friendId } = req.body || {};

    if (!friendId || !mongoose.Types.ObjectId.isValid(friendId)) {
      return next(new AppError("Valid friendId is required", 400, true));
    }

    if (userId.toString() === friendId.toString()) {
      return next(
        new AppError("You cannot send a request to yourself", 400, true)
      );
    }

    // Ensure friend exists
    const friend = await User.findById(friendId).select("_id friendRequests");
    if (!friend) {
      return next(new AppError("User not found", 404, true));
    }

    // Ensure current user is up-to-date from DB
    const user = await User.findById(userId).select("_id friends requestsSent");

    // If already friends
    const alreadyFriends = user.friends?.some(
      (id) => id.toString() === friendId.toString()
    );
    if (alreadyFriends) {
      return next(new AppError("This is already your friend", 400, true));
    }

    const alreadySent = user.requestsSent?.some(
      (id) => id.toString() === friendId.toString()
    );

    if (alreadySent) {
      // Cancel previously sent request
      await Promise.all([
        User.findByIdAndUpdate(userId, { $pull: { requestsSent: friendId } }),
        User.findByIdAndUpdate(friendId, { $pull: { friendRequests: userId } }),
      ]);

      return res.status(200).json({
        success: true,
        message: "Friend request removed",
      });
    }

    // Otherwise, send new request
    await Promise.all([
      User.findByIdAndUpdate(friendId, {
        $addToSet: { friendRequests: userId },
      }),
      User.findByIdAndUpdate(userId, { $addToSet: { requestsSent: friendId } }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Friend request sent",
    });
  })
);

export default router;
