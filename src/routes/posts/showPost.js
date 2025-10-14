import express from "express";
import mongoose from "mongoose";
import Post from "../../models/Post.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";

const router = express.Router();

// GET /api/posts/:id - Get single post with likes count and comments
router.get(
  "/api/posts/:id",
  tryCatch(async (req, res, next) => {
    const postId = req.params.id;

    // Validate postId
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return next(new AppError("Valid postId is required", 400, true));
    }

    // Use aggregation to get post with author info, likes count, and comments
    const result = await Post.aggregate([
      // Match the post by ID
      { $match: { _id: new mongoose.Types.ObjectId(postId) } },

      // Add likes count and isEdited field
      {
        $addFields: {
          likesCount: { $size: "$likes" },
          isEdited: { $gt: ["$__v", 0] },
        },
      },

      // Lookup post author info
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "author",
          pipeline: [
            {
              $project: {
                _id: 1,
                username: 1,
                profilePicture: 1,
              },
            },
          ],
        },
      },

      // Lookup comments with author info
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
                  {
                    $project: {
                      _id: 1,
                      username: 1,
                      profilePicture: 1,
                    },
                  },
                ],
              },
            },
            // Add isEdited field to commentsءذ
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

      // Reshape the author field
      {
        $addFields: {
          userId: { $arrayElemAt: ["$author", 0] },
        },
      },

      // Remove the temporary author array
      { $unset: "author" },

      // Project only needed fields
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          image: 1,
          likes: 1,
          likesCount: 1,
          comments: 1,
          userId: 1,
          isEdited: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (!result || result.length === 0) {
      return next(new AppError("Post not found", 404, true));
    }

    const postData = result[0];

    res.status(200).json({
      success: true,
      message: "Post retrieved successfully",
      data: {
        post: postData,
      },
    });
  })
);

export default router;
