import express from "express";
import mongoose from "mongoose";
import Comment from "../../models/Comment.js";
import Post from "../../models/Post.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";

const router = express.Router();

// PATCH /api/editcomment
router.patch(
  "/api/editcomment",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    const { commentId, value } = req.body;
    const userId = req.user._id;

    // Validate commentId
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return next(new AppError("Valid commentId is required", 400, true));
    }

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(new AppError("Comment not found", 404, true));
    }

    // Check if post exists
    const post = await Post.findById(comment.postId);
    if (!post) {
      return next(new AppError("Post not found", 404, true));
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== userId.toString()) {
      return next(
        new AppError("You can only edit your own comments", 403, true)
      );
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

    // Update comment
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { value: value.trim() },
      { new: true, runValidators: true }
    );

    // Prepare response with user info from authMiddleware
    const responseComment = {
      ...updatedComment.toObject(),
      userId: {
        _id: req.user._id,
        username: req.user.username,
        profilePicture: req.user.profilePicture,
      },
      isEdited: updatedComment.__v > 0,
    };

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: {
        comment: responseComment,
      },
    });
  })
);

export default router;
