import express from "express";
import { validationResult } from "express-validator";
import Post from "../../models/Post.js";
import User from "../../models/User.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";
import { validatePost } from "../../utilities/validation/postValidation.js";

const router = express.Router();

// POST /api/addpost
router.post(
  "/api/addpost",
  authMiddleware,
  validatePost,
  tryCatch(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return next(new AppError(errorMessages.join(", "), 400, true));
    }

    const { title, description, image = null, isPrivate = false } = req.body;
    const userId = req.user._id;

    // Create new post
    const newPost = new Post({
      userId,
      title,
      description,
      image: image ,
      isPrivate,
    });

    // Save post to database
    const savedPost = await newPost.save();

    // Add post to user's posts array
    await User.findByIdAndUpdate(userId, {
      $addToSet: { posts: savedPost._id },
    });

    // Prepare response with user info from authMiddleware
    const responsePost = {
      ...savedPost.toObject(),
      userId: {
        _id: req.user._id,
        username: req.user.username,
        profilePicture: req.user.profilePicture,
      },
    };

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: {
        post: responsePost,
      },
    });
  })
);

export default router;
