import express from "express";
import mongoose from "mongoose";
import Comment from "../../models/Comment.js";
import Post from "../../models/Post.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import Notification from "../../models/Notification.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";

const router = express.Router();

// POST /api/addcomment
router.post(
  "/api/addcomment",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    const { postId, value } = req.body;
    const userId = req.user._id;

    // Validate postId
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return next(new AppError("Valid postId is required", 400, true));
    }

    // Validate comment value
    if (!value || typeof value !== "string" || value.trim().length === 0) {
      return next(new AppError("Comment value is required", 400, true));
    }

    if (value.trim().length > 500) {
      return next(
        new AppError("Comment must be less than 500 characters", 400, true)
      );
    }

    // Check if post exists
    const post = await Post.findById(postId).select("userId");
    if (!post) {
      return next(new AppError("Post not found", 404, true));
    }

    // Create new comment
    const newComment = new Comment({
      userId,
      postId,
      value: value.trim(),
    });

    // Save comment to database
    const savedComment = await newComment.save();

    const operations = [
      // Add comment to post's comments array
      Post.findByIdAndUpdate(postId, {
        $addToSet: { comments: savedComment._id },
      }),
    ];

    // Only create a notification if someone else comments on the post
    if (post.userId.toString() !== userId.toString()) {
      operations.push(
        Notification.create({
          userId: post.userId,
          sender: userId,
          type: "addComment",
          message: `${req.user.username} commented on your post.`,
          route: `/posts/${postId}`,
        })
      );
    }
    await Promise.all(operations);

    // Prepare response with user info from authMiddleware
    const responseComment = {
      ...savedComment.toObject(),
      userId: {
        _id: req.user._id,
        username: req.user.username,
        profilePicture: req.user.profilePicture,
      },
    };

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        comment: responseComment,
      },
    });
  })
);

export default router;
