import { body } from "express-validator";
import { stopOnError } from "./validationResult.js";

// Validation rules for user login
export const validateLogin = [
  // Email validation
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .normalizeEmail(),
  stopOnError,
  // Password validation
  body("password").notEmpty().withMessage("Password is required"),
  stopOnError,
];
