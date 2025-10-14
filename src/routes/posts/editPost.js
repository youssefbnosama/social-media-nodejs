import { Router } from "express";
import upload from "../../utilities/multer/multer.js";
import { uploadToCloudinary } from "../../utilities/multer/cloudinaryUpload.js";
import { validationResult, matchedData } from "express-validator";
import mongoose from "mongoose";
import Post from "../../models/Post.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";
import { validatePostUpdate } from "../../utilities/validation/postValidation.js";

const router = Router();

// PATCH /api/editpost
router.patch(
  "/api/editpost",
  authMiddleware,
  upload.single("image"),
  validatePostUpdate,
  tryCatch(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return next(new AppError(errorMessages.join(", "), 400, true));
    }
    let result = null;
    if (req.file) {
      result = await uploadToCloudinary(req.file);
    }
    // Get validated and sanitized data (only fields defined in validators)
    const validatedData = matchedData(req);
    const { postId, ...updateData } = validatedData;
    const userId = req.user._id;

    // Validate postId
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return next(new AppError("Valid postId is required", 400, true));
    }

    // Find post and check ownership
    const post = await Post.findById(postId);
    if (!post) {
      return next(new AppError("Post not found", 404, true));
    }

    // Check if user owns the post
    if (post.userId.toString() !== userId.toString()) {
      return next(new AppError("You can only edit your own posts", 403, true));
    }

    // Add image URL if uploaded
    if (result) {
      updateData.image = result.secure_url;
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(postId, updateData, {
      new: true,
      runValidators: true,
    });

    // Prepare response with user info from authMiddleware
    const responsePost = {
      ...updatedPost.toObject(),
      userId: {
        _id: req.user._id,
        username: req.user.username,
        profilePicture: req.user.profilePicture,
      },
    };

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: {
        post: responsePost,
      },
    });
  })
);

export default router;
