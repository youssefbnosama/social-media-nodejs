import { body } from "express-validator";

// Validation rules for user login
export const validateLogin = [
  // Email validation
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  // Password validation
  body("password").notEmpty().withMessage("Password is required"),
];
