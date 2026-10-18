import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs";
import path from "node:path";
import { ApiError } from "../utils/ApiError.js";

const uploadDirectory = path.resolve("public", "temp");
const imageExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    mkdir(uploadDirectory, { recursive: true }, (error) => {
      cb(error, uploadDirectory);
    });
  },
  filename: function (req, file, cb) {
    cb(null, `${randomUUID()}${imageExtensions[file.mimetype] || ".upload"}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!Object.hasOwn(imageExtensions, file.mimetype)) {
      return cb(new ApiError(415, "Avatar must be a JPEG, PNG, or WebP image"));
    }
    cb(null, true);
  },
});
