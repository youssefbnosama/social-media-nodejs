import { Router } from "express";
import Notification from "../../models/Notification.js";
import { authMiddleware } from "../../utilities/tokens/accessTokenMiddleware.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";

const router = Router();

// GET /api/shownotification - Get paginated notifications for the logged-in user
router.get(
  "/api/shownotification",
  authMiddleware,
  tryCatch(async (req, res) => {
    const userId = req.user._id;

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch a paginated list of notifications and the total count
    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 }) // Show newest first
        .skip(skip)
        .limit(limit)
        .populate("sender", "username profilePicture") // Populate sender info
        .lean(), // Use .lean() for faster read-only operations
      Notification.countDocuments({ userId }),
    ]);

    // Get the IDs of the notifications that were just fetched
    const notificationIds = notifications.map((n) => n._id);

    // Mark the fetched notifications as read in the database
    if (notificationIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, isRead: false },
        { $set: { isRead: true } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: {
        notifications,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  })
);

export default router;
