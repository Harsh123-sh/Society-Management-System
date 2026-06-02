const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadRoot = path.join(__dirname, "..", "uploads", "documents");
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadRoot);
  },
  filename(_req, file, cb) {
    const timestamp = Date.now();
    const randomPart = Math.round(Math.random() * 1e9);
    const safeOriginal = String(file.originalname || "document")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 100);
    cb(null, `${timestamp}-${randomPart}-${safeOriginal}`);
  },
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

function fileFilter(_req, file, cb) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error("Only PDF, PNG and JPG files are allowed"));
  }
  cb(null, true);
}

const uploadDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  uploadDocument,
};
