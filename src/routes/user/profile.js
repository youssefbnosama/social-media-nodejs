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
            // Add likes count to each post
            {
              $addFields: {
                likesCount: { $size: "$likes" },
                isEdited: { $gt: ["$__v", 0] },
              },
            },
            // Lookup comments for each post
            {
              $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "postId",
                as: "comments",
                pipeline: [
                  // Add user info to each comment
                  {
                    $lookup: {
                      from: "users",
                      localField: "userId",
                      foreignField: "_id",
                      as: "user",
                      pipeline: [
                        { $project: { username: 1, profilePicture: 1 } },
                      ],
                    },
                  },
                  // Add isEdited field to comments
                  {
                    $addFields: {
                      userId: { $arrayElemAt: ["$user", 0] },
                      isEdited: { $gt: ["$__v", 0] },
                    },
                  },
                  // Remove the temporary user array
                  { $unset: "user" },
                  // Sort comments by creation date (newest first)
                  { $sort: { createdAt: -1 } },
                ],
              },
            },
            // Sort posts by creation date (newest first)
            { $sort: { createdAt: -1 } },
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
