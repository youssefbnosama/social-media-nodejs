import express from "express";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";
import User from "../../models/User.js";
import Post from "../../models/Post.js";
import Comment from "../../models/Comment.js";

const router = express.Router();

// DELETE /api/deleteuser - Delete user account
router.delete(
  "/api/deleteuser",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    const userId = req.user._id;
    const postIds = req.user.posts; // Get post IDs from the authenticated user object

    // 1. First, delete the user document
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return next(new AppError("User not found", 404, true));
    }

    // 2. If user was deleted, proceed with cleaning up all associated data in parallel
    await Promise.all([
      // Delete all comments on the user's posts
      postIds.length > 0
        ? Comment.deleteMany({ postId: { $in: postIds } })
        : Promise.resolve(),

      // Delete all the user's posts
      Post.deleteMany({ userId }),

      // Delete all comments made by the user on other posts
      Comment.deleteMany({ userId }),

      // Remove user's likes from all posts
      Post.updateMany({}, { $pull: { likes: userId } }),

      // Clean up friend/request lists from other users
      User.updateMany(
        {
          $or: [
            { friends: userId },
            { friendRequests: userId },
            { requestsSent: userId },
          ],
        },
        {
          $pull: {
            friends: userId,
            friendRequests: userId,
            requestsSent: userId,
          },
        }
      ),
    ]);

    // Clear cookies on the client side
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    // Return success response
    res.status(200).json({
      success: true,
      message: "User account deleted successfully",
      data: {
        deletedUser: {
          id: deletedUser._id,
          username: deletedUser.username,
          email: deletedUser.email,
        },
      },
    });
  })
);

export default router;
