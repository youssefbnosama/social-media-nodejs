import { body } from "express-validator";
import { stopOnError } from "./validationResult.js";

// Validation rules for creating/updating posts
export const validatePost = [
  // Title validation (required)
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .bail()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
    stopOnError,
  

  // Description validation (required)
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .bail()
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Description must be between 1 and 1000 characters"),
    stopOnError,

  // Image validation (optional)
  body("image")
    .optional()
    .isString()
    .withMessage("Image must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Image URL must be between 1 and 500 characters"),
    stopOnError,

  // isPrivate (optional, boolean, default false)
  body("isPrivate")
    .optional()
    .isBoolean()
    .withMessage("isPrivate must be a boolean")
    .toBoolean()
];

// Validation rules for updating posts (all fields optional)
export const validatePostUpdate = [
  // Title validation (optional)
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
    stopOnError,

  // Description validation (optional)
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Description must be between 1 and 1000 characters"),
    stopOnError,

  // Image validation (optional)
  body("image")
    .optional()
    .isString()
    .withMessage("Image must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Image URL must be between 1 and 500 characters"),
    stopOnError,

  // isPrivate (optional, boolean)
  body("isPrivate")
    .optional()
    .isBoolean()
    .withMessage("isPrivate must be a boolean")
    .toBoolean(),
    stopOnError,
];
