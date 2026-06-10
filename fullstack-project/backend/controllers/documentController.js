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

    if (req.user.role !== "resident") {
      return res.status(403).json({
        success: false,
        message: "Only residents can upload documents",
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
    const documentType = req.query.documentType ? String(req.query.documentType).trim() : "";
    const docs = await documentModel.getDocuments({
      userId: req.user.id,
      societyId: req.user?.societyId || req.user?.society_id || null,
      status: status || undefined,
      documentType: documentType || undefined,
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
    const documentType = req.query.documentType ? String(req.query.documentType).trim() : "";

    const docs = await documentModel.getDocuments({
      societyId: req.user?.societyId || req.user?.society_id || null,
      status: status || undefined,
      residentType: residentType || undefined,
      documentType: documentType || undefined,
      includeDeleted: false,
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

async function getDocumentHistory(req, res) {
  try {
    const documentId = Number(req.params.id);
    if (!documentId) {
      return res.status(400).json({ success: false, message: "Valid document id is required" });
    }

    const history = await documentModel.getDocumentHistory(documentId);
    if (!history) {
      return res.status(404).json({ success: false, message: "Document history not found" });
    }

    const ownsDocument = history.some((doc) => doc.user_id === req.user.id);
    if (!ownsDocument && !["admin", "secretary"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    return res.json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function softDeleteDocument(req, res) {
  try {
    const documentId = Number(req.params.id);
    if (!documentId) {
      return res.status(400).json({ success: false, message: "Valid document id is required" });
    }

    const existing = await documentModel.getDocumentById(documentId);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (existing.user_id !== req.user.id && !["admin", "secretary"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const deleted = await documentModel.softDeleteDocument(documentId, req.user.id);
    if (!deleted) {
      return res.status(400).json({ success: false, message: "Document could not be deleted or is already deleted" });
    }

    return res.json({ success: true, message: "Document moved to trash" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function restoreDocument(req, res) {
  try {
    const documentId = Number(req.params.id);
    if (!documentId) {
      return res.status(400).json({ success: false, message: "Valid document id is required" });
    }

    const restored = await documentModel.restoreDocument(documentId);
    if (!restored) {
      return res.status(404).json({ success: false, message: "Document not found or not in trash" });
    }

    return res.json({ success: true, message: "Document restored successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function permanentlyDeleteDocument(req, res) {
  try {
    const documentId = Number(req.params.id);
    if (!documentId) {
      return res.status(400).json({ success: false, message: "Valid document id is required" });
    }

    const deleted = await documentModel.permanentlyDeleteDocument(documentId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    return res.json({ success: true, message: "Document permanently deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  uploadDocument,
  getMyDocuments,
  getAllDocuments,
  reviewDocument,
  getDocumentHistory,
  softDeleteDocument,
  restoreDocument,
  permanentlyDeleteDocument,
};
