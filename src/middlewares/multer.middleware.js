import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs";
import path from "node:path";

const uploadDirectory = path.resolve("public", "temp");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    mkdir(uploadDirectory, { recursive: true }, (error) => {
      cb(error, uploadDirectory);
    });
  },
  filename: function (req, file, cb) {
    cb(null, `${randomUUID()}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
});
