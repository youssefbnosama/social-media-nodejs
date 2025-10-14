import express from "express";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";

const router = express.Router();

// POST /api/logout
router.post(
  "/api/logout",
  tryCatch(async (req, res, next) => {
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
  })
);

export default router;
