import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { tryCatch } from "../errorHandling/tryCatch.js";
import AppError from "../errorHandling/classObject.js";

export const authMiddleware = tryCatch(async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token)
    return next(new AppError("Access Denied. No token provided.", 401, true));

  const decoded = jwt.verify(token, process.env.SECRET_WEB_TOKEN);

  const user = await User.findById(decoded.id)
    .populate("tasks")
    .select("-password");

  if (!user) return next(new AppError("User not found.", 404, true));

  req.user = user;

  next();
});
