import { body } from "express-validator";
import User from "../../models/User.js";
import { stopOnError } from "./validationResult.js";

// Validation rules for user registration
export const validateSignup = [
  // Username validation
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .bail()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .bail()
    .custom(async (value) => {
      const existingUser = await User.findOne({ username: value });
      if (existingUser) {
        throw new Error("Username already exists");
      }
      return true;
    }),
    stopOnError,

  // Email validation
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .normalizeEmail()
    .custom(async (value) => {
      const existingUser = await User.findOne({ email: value });
      if (existingUser) {
        throw new Error("Email already exists");
      }
      return true;
    }),
    stopOnError,
  // Password validation
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
    stopOnError,
];
