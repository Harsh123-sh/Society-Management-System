const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadRoot = path.join(__dirname, "..", "uploads", "documents");
const visitorUploadRoot = path.join(__dirname, "..", "uploads", "visitors");
const settingsUploadRoot = path.join(__dirname, "..", "uploads", "settings");
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}
if (!fs.existsSync(visitorUploadRoot)) {
  fs.mkdirSync(visitorUploadRoot, { recursive: true });
}
if (!fs.existsSync(settingsUploadRoot)) {
  fs.mkdirSync(settingsUploadRoot, { recursive: true });
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

const visitorStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, visitorUploadRoot);
  },
  filename(_req, file, cb) {
    const timestamp = Date.now();
    const randomPart = Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname || "") || ".jpg";
    cb(null, `${timestamp}-${randomPart}-visitor${extension}`);
  },
});

const settingsStorage = multer.diskStorage({
  destination(req, _file, cb) {
    const type = String(req.originalUrl || "").includes("society-logo") ? "logos" : "profiles";
    const destination = path.join(settingsUploadRoot, type);
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    cb(null, destination);
  },
  filename(req, file, cb) {
    const timestamp = Date.now();
    const randomPart = Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname || "") || ".jpg";
    const prefix = String(req.originalUrl || "").includes("society-logo") ? "society-logo" : "profile";
    cb(null, `${timestamp}-${randomPart}-${prefix}${extension}`);
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

function visitorPhotoFilter(_req, file, cb) {
  if (!["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
    return cb(new Error("Only PNG and JPG visitor photos are allowed"));
  }
  cb(null, true);
}

function settingsImageFilter(_req, file, cb) {
  if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG and WebP images are allowed"));
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

const uploadVisitorPhoto = multer({
  storage: visitorStorage,
  fileFilter: visitorPhotoFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadSettingsImage = multer({
  storage: settingsStorage,
  fileFilter: settingsImageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  uploadDocument,
  uploadVisitorPhoto,
  uploadSettingsImage,
};
