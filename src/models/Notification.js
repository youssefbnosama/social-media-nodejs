import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // The user who will receive the notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The user who triggered the notification (e.g., liked a post, sent a request)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The type of notification
    type: {
      type: String,
      required: true,
      enum: [
        "friendRequest",
        "postLike",
        "requestAccepted",
        "requestDeclined",
        "addComment",
      ],
    },
    // The client-side route to navigate to when the notification is clicked
    route: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // The status of the notification
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

// Add an index on userId for faster lookups of a user's notifications
notificationSchema.index({ userId: 1 });

export default Notification;
