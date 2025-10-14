import express from "express";
import { validationResult, matchedData } from "express-validator";
import { validateSignup } from "../../utilities/validation/signupValidation.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";
import User from "../../models/User.js";
import { hashFunction } from "../../utilities/hashing/hashing.js";

const router = express.Router();

// POST /api/register
router.post(
  "/api/register",
  validateSignup,
  tryCatch(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return next(new AppError(errorMessages.join(", "), 400, true));
    }

    // Get validated and sanitized data
    const { username, email, password } = matchedData(req);

    // Hash the password
    const hashedPassword = await hashFunction(password);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save user to database
    const savedUser = await user.save();

    // Return success response (exclude password from response)
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: savedUser._id,
          username: savedUser.username,
          email: savedUser.email,
          createdAt: savedUser.createdAt,
        },
      },
    });
  })
);

export default router;
