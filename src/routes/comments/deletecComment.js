import express from "express";
import mongoose from "mongoose";
import Comment from "../../models/Comment.js";
import Post from "../../models/Post.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";

const router = express.Router();

// DELETE /api/deletecomment
router.delete(
  "/api/deletecomment",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    const { commentId } = req.body;
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
        new AppError("You can only delete your own comments", 403, true)
      );
    }

    // Delete comment from both collections
    await Promise.all([
      Comment.findByIdAndDelete(commentId),
      Post.findByIdAndUpdate(comment.postId, {
        $pull: { comments: commentId },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  })
);

export default router;
