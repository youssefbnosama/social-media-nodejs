import express from "express";
import mongoose from "mongoose";
import Post from "../../models/Post.js";
import User from "../../models/User.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import Comment from "../../models/Comment.js";

const router = express.Router();

// GET /api/posts/:id - Get single post with likes count and comments
router.get(
  "/api/posts/:id",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    const postId = req.params.id;

    // Validate postId
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return next(new AppError("Valid postId is required", 400, true));
    }

    // Fetch post to check privacy
    const post = await Post.findById(postId).select("isPrivate userId");
    if (!post) {
      return next(new AppError("Post not found", 404, true));
    }

    // Fetch post's author to check their privacy settings
    const postAuthor = await User.findById(post.userId).select(
      "isPrivate friends"
    );
    if (!postAuthor) {
      // This case is unlikely if DB is consistent, but good to have
      return next(new AppError("Post author not found", 404, true));
    }

    const isPostPrivate = post.isPrivate;
    const isUserPrivate = postAuthor.isPrivate;
    const requesterId = req.user._id.toString();
    const isFriend = postAuthor.friends.some(
      (id) => id.toString() === requesterId
    );
    const isOwner = requesterId === post.userId.toString();

    if (!isOwner && !isFriend && (isUserPrivate || isPostPrivate)) {
      return next(new AppError("This post is private", 403, true));
    }

    // Pagination for comments
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const skip = (page - 1) * limit;

    // Sorting for comments
    const commentSortField = req.query.commentSort || "createdAt";
    const commentSortOrder = req.query.commentOrder === "asc" ? 1 : -1;
    const sortObj = { [commentSortField]: commentSortOrder };

    // First aggregation: Get post details and paginated comments
    const postResult = await Post.aggregate([
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
          pipeline: [{ $project: { _id: 1, username: 1, profilePicture: 1 } }],
        },
      },

      // Lookup comments with author info, sorting, and pagination
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments",
          pipeline: [
            // Sort, skip, and limit comments for pagination
            { $sort: sortObj },
            { $skip: skip },
            { $limit: limit },
            // Add user info to each paginated comment
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
                pipeline: [{ $project: { username: 1, profilePicture: 1 } }],
              },
            },
            // Add isEdited field and reshape the comment's user field
            {
              $addFields: {
                userId: { $arrayElemAt: ["$user", 0] },
                isEdited: { $gt: ["$__v", 0] },
              },
            },
            // Remove the temporary user array
            { $unset: "user" },
          ],
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

    // Second, optimized aggregation: Get total comment count
    const totalComments = await Comment.countDocuments({
      postId: new mongoose.Types.ObjectId(postId),
    });

    if (!postResult || postResult.length === 0) {
      return next(new AppError("Post not found", 404, true));
    }

    // Combine the results
    const postData = postResult[0];
    postData.commentsCount = totalComments;

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
