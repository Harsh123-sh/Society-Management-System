const db = require("../config/db");

async function createDocument({ userId, societyId, documentType, fileUrl }) {
  const { rows: result } = await db.query(
    `INSERT INTO documents (user_id, society_id, document_type, file_url, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [userId, societyId || null, documentType, fileUrl]
  );

  return getDocumentById(result.insertId);
}

async function getDocumentById(id) {
  const { rows } = await db.query(
    `SELECT d.id, d.user_id, d.society_id, d.document_type, d.file_url, d.status, d.notes, d.reviewed_by,
            d.reviewed_at, d.created_at,
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

async function getDocuments({ userId, status, residentType, societyId }) {
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

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT d.id, d.user_id, d.society_id, d.document_type, d.file_url, d.status, d.notes, d.reviewed_by,
            d.reviewed_at, d.created_at,
            u.name AS user_name, u.email AS user_email, u.resident_type,
            reviewer.name AS reviewed_by_name
     FROM documents d
     JOIN users u ON u.id = d.user_id
     LEFT JOIN users reviewer ON reviewer.id = d.reviewed_by
     ${whereClause}
     ORDER BY d.id DESC`,
    params
  );

  return rows;
}

async function reviewDocument({ documentId, status, notes, reviewedBy }) {
  await db.query(
    `UPDATE documents
     SET status = ?, notes = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [status, notes || null, reviewedBy, documentId]
  );

  return getDocumentById(documentId);
}

module.exports = {
  createDocument,
  getDocumentById,
  getDocuments,
  reviewDocument,
};
