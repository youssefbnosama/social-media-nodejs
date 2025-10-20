import express from "express";
import mongoose from "mongoose";
import User from "../../models/User.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";

const router = express.Router();

// GET /api/showfriends/:id - Get a user's friends list
router.get(
  "/api/showfriends/:id",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    const { id } = req.params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Valid user id is required", 400, true));
    }

    // Fetch the target user with their friends populated
    const theUser = await User.findById(id)
      .select("_id isPrivate friends")
      .populate({ path: "friends", select: "username profilePicture" });

    if (!theUser) {
      return next(new AppError("User not found", 404, true));
    }

    // Privacy and access checks
    const isOwner = req.user._id.equals(id);
    const isFriend = Array.isArray(req.user.friends)
      ? req.user.friends.some((fid) => fid.toString() === id.toString())
      : false;
    const isPrivate = !!theUser.isPrivate;

    if (!isOwner && !isFriend && isPrivate) {
      return next(new AppError("This profile is private", 403, true));
    }

    return res.status(200).json({
      success: true,
      message: "Friends retrieved successfully",
      data: theUser.friends || [],
    });
  })
);

export default router;
