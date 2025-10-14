import cloudinary from "cloudinary";

export const uploadToCloudinary = async (file) => {
  if (!file) throw new Error("No file provided");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder: "social_media_uploads" }, // ممكن تغير اسم الفولدر
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
};
