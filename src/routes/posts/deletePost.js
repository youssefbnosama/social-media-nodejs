import express from "express";
import mongoose from "mongoose";
import Post from "../../models/Post.js";
import Comment from "../../models/Comment.js";
import User from "../../models/User.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";

const router = express.Router();

// DELETE /api/deletepost/:id
router.delete(
  "/api/deletepost/:id",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    const postId = req.params.id;
    const userId = req.user._id;

    // Validate postId
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return next(new AppError("Valid postId is required", 400, true));
    }

    // Find the post to verify ownership before deleting
    const post = await Post.findById(postId).select("userId");

    if (!post) {
      return next(new AppError("Post not found", 404, true));
    }

    if (post.userId.toString() !== userId.toString()) {
      return next(
        new AppError("You can only delete your own posts", 403, true)
      );
    }

    // Perform all deletions in parallel for efficiency
    const [deletedPost] = await Promise.all([
      // 1. Delete the post document
      Post.findByIdAndDelete(postId),
      // 2. Delete all comments associated with the post
      Comment.deleteMany({ postId: postId }),
      // 3. Remove the post from the user's posts array
      User.findByIdAndUpdate(userId, { $pull: { posts: postId } }),
    ]);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: { postId: deletedPost?._id || postId },
    });
  })
);

export default router;
