import express from "express";
import { validationResult, matchedData } from "express-validator";
import jwt from "jsonwebtoken";
import { validateLogin } from "../../utilities/validation/loginValidation.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";
import User from "../../models/User.js";
import { compareHashing } from "../../utilities/hashing/hashing.js";

const router = express.Router();

// POST /api/login
router.post(
  "/api/login",
  validateLogin,
  tryCatch(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return next(new AppError(errorMessages.join(", "), 400, true));
    }

    // Get validated and sanitized data
    const { email, password } = matchedData(req);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("Invalid email or password", 401, true));
    }

    // Compare password
    const isPasswordValid = await compareHashing(password, user.password);
    if (!isPasswordValid) {
      return next(new AppError("Invalid email or password", 401, true));
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.SECRET_WEB_TOKEN,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_SECRET_WEB_TOKEN,
      { expiresIn: "7d" }
    );

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return success response (exclude password from response)
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      },
    });
  })
);

export default router;
