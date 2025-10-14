import express from "express";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import AppError from "../../utilities/errorHandling/classObject.js";
import User from "../../models/User.js";

const router = express.Router();

// DELETE /api/deleteuser - Delete user account
router.delete(
  "/api/deleteuser",
  authMiddleware,
  tryCatch(async (req, res, next) => {
    // Delete user from database using ID from req.user
    const deletedUser = await User.findByIdAndDelete(req.user.id);

    if (!deletedUser) {
      return next(new AppError("User not found", 404, true));
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "User account deleted successfully",
      data: {
        deletedUser: {
          id: deletedUser._id,
          username: deletedUser.username,
          email: deletedUser.email,
        },
      },
    });
  })
);

export default router;
