import express from "express";
import cors from "cors";

import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import {v2 as cloudinary} from "cloudinary";

import mongoose from "mongoose";
import errorHandler from "./src/utilities/errorHandling/errorHandlerMiddleware.js";
import refreshTokenRoute from "./src/utilities/tokens/refreshTokenRoute.js";

import form from "./src/routes/form/main.js";
import user from "./src/routes/user/main.js"; 
import addFriends from "./src/routes/addFriends/main.js";
import posts from "./src/routes/posts/main.js";
import likes from "./src/routes/likes/main.js";
import comments from "./src/routes/comments/main.js";
import notification from "./src/routes/notifications/main.js"

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
dotenv.config();
// Origins allowed depend on environment

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
mongoose
  .connect("mongodb://127.0.0.1:27017/social-media")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
app.use(refreshTokenRoute);
app.use(form);
app.use(user);
app.use(addFriends);
app.use(posts);
app.use(likes);
app.use(comments);
app.use(notification);

app.use(errorHandler);
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
