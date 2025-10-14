import express from "express";
import mongoose from "mongoose";
import Post from "../../models/Post.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";

const router = express.Router();

// POST /api/togglelike
router.post(
  "/api/togglelike",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    const { postId } = req.body;
    const userId = req.user._id;

    // Validate postId
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return next(new AppError("Valid postId is required", 400, true));
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return next(new AppError("Post not found", 404, true));
    }

    // Check if user already liked the post
    const hasLiked = post.likes.some(
      (likeId) => likeId.toString() === userId.toString()
    );

    let updatedPost;
    let message;

    if (hasLiked) {
      // Unlike: remove user from likes array
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId } },
        { new: true }
      );
      message = "Post unliked successfully";
    } else {
      // Like: add user to likes array
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: userId } },
        { new: true }
      );
      message = "Post liked successfully";
    }

    res.status(200).json({
      success: true,
      message,
      data: {
        post: updatedPost,
        liked: !hasLiked, // Return the new like status
      },
    });
  })
);

export default router;
