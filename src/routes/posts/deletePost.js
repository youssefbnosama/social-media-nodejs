import express from "express";
import mongoose from "mongoose";
import Post from "../../models/Post.js";
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

    // Ensure the post belongs to the authenticated user
    const userHasPost = Array.isArray(req.user.posts)
      ? req.user.posts.some((p) => p.toString() === postId)
      : false;

    if (!userHasPost) {
      // Optionally verify existence and ownership directly from DB to be safe
      const postOwned = await Post.exists({ _id: postId, userId });
      if (!postOwned) {
        return next(
          new AppError("You can only delete your own posts", 403, true)
        );
      }
    }

    // Delete the post
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      return next(new AppError("Post not found", 404, true));
    }

    // Remove the post from the user's posts array
    await User.findByIdAndUpdate(userId, { $pull: { posts: deletedPost._id } });

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: { postId: deletedPost._id },
    });
  })
);

export default router;
