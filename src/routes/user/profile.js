import express from "express";
import mongoose from "mongoose";
import User from "../../models/User.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";

const router = express.Router();

// GET /api/profile - Get authenticated user profile with posts
router.get(
  "/api/profile",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    const userId = req.user._id;

    // Pagination and sorting parameters
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sort || "createdAt";
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const sortObj = { [sortField]: sortOrder };

    // Use aggregation to get user with posts, comments, and likes count
    const result = await User.aggregate([
      // Match the user by ID
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },

      // Lookup posts for this user
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "userId",
          as: "posts",
          pipeline: [
            // Sort, skip, and limit the posts for pagination
            { $sort: sortObj },
            { $skip: skip },
            { $limit: limit },
            // Add likes and comments count to each post
            {
              $addFields: {
                likesCount: { $size: "$likes" },
                isEdited: { $gt: ["$__v", 0] },
              },
            },
            // Lookup comments just to get the count
            {
              $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "postId",
                as: "comments",
              },
            },
            // Add commentsCount and then remove the comments array
            { $addFields: { commentsCount: { $size: "$comments" } } },
            { $unset: "comments" },
          ],
        },
      },

      // Project only needed fields
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          profilePicture: 1,
          bio: 1,
          posts: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (!result || result.length === 0) {
      return next(new AppError("User not found", 404, true));
    }

    const userData = result[0];

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: {
        userInfo: {
          _id: userData._id,
          username: userData.username,
          email: userData.email,
          profilePicture: userData.profilePicture,
          bio: userData.bio,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
        posts: userData.posts || [],
      },
    });
  })
);

export default router;
