const path = require("path");
const documentModel = require("../models/documentModel");

function getPublicFilePath(filePath) {
  const normalized = filePath.split(path.sep).join("/");
  const uploadsIndex = normalized.lastIndexOf("/uploads/");
  if (uploadsIndex === -1) {
    return null;
  }
  return normalized.slice(uploadsIndex);
}

async function uploadDocument(req, res) {
  try {
    const { documentType } = req.body;

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "documentType is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Document file is required",
      });
    }

    if (req.user.role !== "resident" || req.user.residentType !== "tenant") {
      return res.status(403).json({
        success: false,
        message: "Only tenant residents can upload documents",
      });
    }

    const fileUrl = getPublicFilePath(req.file.path);
    const document = await documentModel.createDocument({
      userId: req.user.id,
      societyId: req.user?.societyId || req.user?.society_id || null,
      documentType: String(documentType).trim(),
      fileUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getMyDocuments(req, res) {
  try {
    const status = req.query.status ? String(req.query.status).trim() : "";
    const docs = await documentModel.getDocuments({
      userId: req.user.id,
      societyId: req.user?.societyId || req.user?.society_id || null,
      status: status || undefined,
    });

    return res.json({ success: true, data: docs });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getAllDocuments(req, res) {
  try {
    const status = req.query.status ? String(req.query.status).trim() : "";
    const residentType = req.query.residentType
      ? String(req.query.residentType).trim()
      : "";

    const docs = await documentModel.getDocuments({
      societyId: req.user?.societyId || req.user?.society_id || null,
      status: status || undefined,
      residentType: residentType || undefined,
    });

    return res.json({ success: true, data: docs });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function reviewDocument(req, res) {
  try {
    const documentId = Number(req.params.id);
    const { status, notes } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Valid document id is required",
      });
    }

    const existing = await documentModel.getDocumentById(documentId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const societyId = req.user?.societyId || req.user?.society_id || null;
    if (societyId && existing.society_id !== societyId) {
      return res.status(403).json({ success: false, message: "Document not found in current society" });
    }

    const updated = await documentModel.reviewDocument({
      documentId,
      status,
      notes,
      reviewedBy: req.user.id,
    });

    return res.json({
      success: true,
      message: "Document reviewed successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  uploadDocument,
  getMyDocuments,
  getAllDocuments,
  reviewDocument,
};
