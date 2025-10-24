import { matchedData } from "express-validator";
import jwt from "jsonwebtoken";
import AppError from "../../utilities/errorHandling/classObject.js";
import User from "../../models/User.js";
import {
  hashFunction,
  compareHashing,
} from "../../utilities/hashing/hashing.js";

// Controller for user registration
export const register = async (req, res, next) => {
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
};

// Controller for user login
export const login = async (req, res, next) => {
  // Get validated and sanitized data
  const { email, password } = matchedData(req);

  // Find user by email
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("There in no user with this Email...", 401, true));
  }

  // Compare password
  const isPasswordValid = await compareHashing(password, user.password);
  if (!isPasswordValid) {
    return next(new AppError("Password doesn't match", 401, true));
  }

  // Generate JWT tokens
  const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_WEB_TOKEN, {
    expiresIn: "1h",
  });

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
};

// Controller for user logout
export const logout = async (req, res, next) => {
  // Clear access token cookie
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
  });

  // Clear refresh token cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
  });

  // Return success response
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};
