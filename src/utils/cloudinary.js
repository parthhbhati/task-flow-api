import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const removeTempFile = async (path) => {
  if (!path) return;

  try {
    await fs.promises.unlink(path);
  } catch (error) {
    // File may already be missing; avoid masking the upload error.
    console.error("Temporary file cleanup failed:", error.message);
  }
};

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) {
    throw new Error("A local file path is required for Cloudinary upload");
  }

  try {
    const cloudinaryConfig = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    };
    const missingConfig = Object.entries(cloudinaryConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingConfig.length > 0) {
      throw new Error(
        `Missing Cloudinary configuration: ${missingConfig.join(", ")}`,
      );
    }

    cloudinary.config(cloudinaryConfig);
    return await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
  } finally {
    await removeTempFile(localFilePath);
  }
};

export { uploadOnCloudinary };