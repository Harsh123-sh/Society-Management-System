const db = require("../config/db");
const userModel = require("./userModel");

async function createDocument({ userId, societyId, documentType, fileUrl }) {
  const { rows: versionRows } = await db.query(
    `SELECT MAX(version) AS max_version
     FROM documents
     WHERE user_id = ? AND document_type = ?`,
    [userId, documentType]
  );

  const version = Number(versionRows[0]?.max_version || 0) + 1;
  const { rows: result } = await db.query(
    `INSERT INTO documents (user_id, society_id, document_type, file_url, status, version)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    [userId, societyId || null, documentType, fileUrl, version]
  );

  return getDocumentById(result.insertId);
}

async function getDocumentById(id) {
  const { rows } = await db.query(
    `SELECT d.id, d.user_id, d.society_id, d.document_type, d.file_url, d.status, d.notes, d.reviewed_by,
            d.reviewed_at, d.version, d.deleted_at, d.deleted_by, d.created_at,
            u.name AS user_name, u.email AS user_email, u.resident_type,
            reviewer.name AS reviewed_by_name
     FROM documents d
     JOIN users u ON u.id = d.user_id
     LEFT JOIN users reviewer ON reviewer.id = d.reviewed_by
     WHERE d.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function getDocuments({ userId, status, residentType, societyId, documentType, includeDeleted = false }) {
  const conditions = [];
  const params = [];

  if (societyId) {
    conditions.push("d.society_id = ?");
    params.push(societyId);
  }

  if (userId) {
    conditions.push("d.user_id = ?");
    params.push(userId);
  }

  if (status) {
    conditions.push("d.status = ?");
    params.push(status);
  }

  if (residentType) {
    conditions.push("u.resident_type = ?");
    params.push(residentType);
  }

  if (documentType) {
    conditions.push("LOWER(d.document_type) = LOWER(?)");
    params.push(documentType);
  }

  if (!includeDeleted) {
    conditions.push("d.deleted_at IS NULL");
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT d.id, d.user_id, d.society_id, d.document_type, d.file_url, d.status, d.notes, d.reviewed_by,
            d.reviewed_at, d.version, d.deleted_at, d.created_at,
            u.name AS user_name, u.email AS user_email, u.resident_type,
            reviewer.name AS reviewed_by_name
     FROM documents d
     JOIN users u ON u.id = d.user_id
     LEFT JOIN users reviewer ON reviewer.id = d.reviewed_by
     ${whereClause}
     ORDER BY d.version DESC, d.id DESC`,
    params
  );

  return rows;
}

async function getDocumentHistory(documentId) {
  const document = await getDocumentById(documentId);
  if (!document) {
    return null;
  }

  const { rows } = await db.query(
    `SELECT d.id, d.user_id, d.society_id, d.document_type, d.file_url, d.status, d.notes,
            d.reviewed_by, d.reviewed_at, d.version, d.deleted_at, d.created_at,
            reviewer.name AS reviewed_by_name
     FROM documents d
     LEFT JOIN users reviewer ON reviewer.id = d.reviewed_by
     WHERE d.user_id = ? AND d.document_type = ?
     ORDER BY d.version DESC, d.created_at DESC`,
    [document.user_id, document.document_type]
  );

  return rows;
}

async function softDeleteDocument(documentId, deletedBy) {
  const { rows: result } = await db.query(
    `UPDATE documents
     SET deleted_at = NOW(), deleted_by = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [deletedBy || null, documentId]
  );

  return result.rowCount > 0;
}

async function restoreDocument(documentId) {
  const { rows: result } = await db.query(
    `UPDATE documents
     SET deleted_at = NULL, deleted_by = NULL
     WHERE id = ? AND deleted_at IS NOT NULL`,
    [documentId]
  );

  return result.rowCount > 0;
}

async function permanentlyDeleteDocument(documentId) {
  const { rows: result } = await db.query(
    `DELETE FROM documents
     WHERE id = ?`,
    [documentId]
  );

  return result.rowCount > 0;
}

async function reviewDocument({ documentId, status, notes, reviewedBy }) {
  await db.query(
    `UPDATE documents
     SET status = ?, notes = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [status, notes || null, reviewedBy, documentId]
  );

  const updated = await getDocumentById(documentId);
  if (!updated) {
    return null;
  }

  const lowerType = String(updated.document_type || "").toLowerCase();
  const kycTypes = ["aadhaar", "pan", "kyc"];
  if (kycTypes.includes(lowerType) && userModel) {
    const newKycStatus = status === "approved" ? "verified" : "rejected";
    await userModel.updateUserKycStatus({
      userId: updated.user_id,
      kycStatus: newKycStatus,
      reviewedBy,
    });
  }

  return updated;
}

module.exports = {
  createDocument,
  getDocumentById,
  getDocuments,
  getDocumentHistory,
  softDeleteDocument,
  restoreDocument,
  permanentlyDeleteDocument,
  reviewDocument,
};
