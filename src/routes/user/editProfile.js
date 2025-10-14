import express from "express";
import { body, validationResult, matchedData } from "express-validator";
import upload from "../../utilities/multer/multer.js";
import { uploadToCloudinary } from "../../utilities/multer/cloudinaryUpload.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";
import User from "../../models/User.js";

const router = express.Router();

// Validation rules for editing profile (optional fields)
const validateEditProfile = [
  // Username validation (optional)
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .custom(async (value, { req }) => {
      if (value) {
        const existingUser = await User.findOne({
          username: value,
          _id: { $ne: req.user.id },
        });
        if (existingUser) {
          throw new Error("Username already exists");
        }
      }
      return true;
    }),

  // Email validation (optional)
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (value) {
        const existingUser = await User.findOne({
          email: value,
          _id: { $ne: req.user.id },
        });
        if (existingUser) {
          throw new Error("Email already exists");
        }
      }
      return true;
    }),

  // Password validation (optional)
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  // Bio (optional)
  body("bio").optional().isString().trim(),

  // Profile picture will be handled by multer upload
];

// PATCH /api/editprofile - Edit user profile
router.patch(
  "/api/editprofile",
  authMiddleware,
  upload.single("profilePicture"),
  validateEditProfile,
  tryCatch(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return next(new AppError(errorMessages.join(", "), 400, true));
    }

    // Handle profile picture upload to Cloudinary
    let result = null;
    if (req.file) {
      result = await uploadToCloudinary(req.file);
    }

    // Get validated and sanitized data (only fields defined in validators)
    const updateData = matchedData(req);

    // Add profile picture URL if uploaded
    if (result) {
      updateData.profilePicture = result.secure_url;
    }

    // Find and update user by ID
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    });

    // Return success response (exclude password from response)
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          bio: updatedUser.bio,
          profilePicture: updatedUser.profilePicture,
          updatedAt: updatedUser.updatedAt,
        },
      },
    });
  })
);

export default router;
