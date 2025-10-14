import { Router } from "express";
import jwt from "jsonwebtoken";
import { tryCatch } from "../errorHandling/tryCatch.js";
import AppError from "../errorHandling/classObject.js";

const router = Router();

// Refresh Token Route
router.post(
  "/api/refreshtoken",
  tryCatch(async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken)
      return next(new AppError("No refresh token provided.", 401, true));

    jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET_WEB_TOKEN,
      (err, decoded) => {
        if (err) return next(new AppError("Invalid refresh token.", 403, true));

        const newAccessToken = jwt.sign(
          { id: decoded.id },
          process.env.SECRET_WEB_TOKEN,
          { expiresIn: "1h" }
        );

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "none",
          maxAge: 60 * 60 * 1000,
        });

        return res.json({ message: "New access token generated." });
      }
    );
  })
);
export default router;