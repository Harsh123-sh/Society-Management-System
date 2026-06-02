const complaintModel = require("../models/complaintModel");
const auditModel = require("../models/auditModel");

function attachComments(complaints, comments) {
  const commentMap = new Map();

  for (const comment of comments) {
    if (!commentMap.has(comment.complaint_id)) {
      commentMap.set(comment.complaint_id, []);
    }
    commentMap.get(comment.complaint_id).push(comment);
  }

  return complaints.map((complaint) => ({
    ...complaint,
    comments: commentMap.get(complaint.id) || [],
  }));
}

async function raiseComplaint(req, res) {
  try {
    const { title, description, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "title and description are required",
      });
    }

    const complaintId = await complaintModel.createComplaint({
      residentId: req.user.id,
      societyId: req.user?.societyId || req.user?.society_id || null,
      title,
      description,
      category,
    });

    const complaint = await complaintModel.getComplaintById(complaintId);

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "CREATE",
      resourceType: "complaint",
      resourceId: complaintId,
      details: `Complaint created by ${req.user.name || req.user.email || req.user.id}`,
      oldValues: null,
      newValues: complaint,
      status: "success",
      request: req,
      societyId: req.user.society_id || null,
      builderId: req.user.builder_id || null,
    });

    res.status(201).json({
      success: true,
      message: "Complaint raised successfully",
      data: complaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getAllComplaints(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const status = req.query.status ? String(req.query.status).trim() : "";
    const category = req.query.category ? String(req.query.category).trim() : "";
    const flatNumber = req.query.flatNumber ? String(req.query.flatNumber).trim() : "";
    const residentId = req.query.residentId ? Number(req.query.residentId) : null;
    const fromDate = req.query.fromDate ? String(req.query.fromDate).trim() : "";
    const toDate = req.query.toDate ? String(req.query.toDate).trim() : "";

    const complaints = await complaintModel.getAllComplaints({
      societyId,
      search,
      status,
      category,
      flatNumber,
      residentId,
      fromDate,
      toDate,
    });
    const comments = await complaintModel.getCommentsByComplaintIds(
      complaints.map((complaint) => complaint.id)
    );

    res.json({
      success: true,
      data: attachComments(complaints, comments),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getMyComplaints(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const status = req.query.status ? String(req.query.status).trim() : "";
    const includeArchived = ["archived", "deleted", "all"].includes(status);

    const complaints = await complaintModel.getComplaintsByResident(req.user.id, {
      societyId,
      search,
      status,
      includeArchived,
    });
    const comments = await complaintModel.getCommentsByComplaintIds(
      complaints.map((complaint) => complaint.id)
    );

    res.json({
      success: true,
      data: attachComments(complaints, comments),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateComplaintStatus(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const complaintId = Number(req.params.id);
    const { status, category } = req.body;

    if (!complaintId || !status) {
      return res.status(400).json({
        success: false,
        message: "complaint id and status are required",
      });
    }

    const complaint = await complaintModel.getComplaintById(complaintId, { societyId });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const updated = await complaintModel.updateComplaintStatus({
      complaintId,
      status,
      updatedBy: req.user.id,
      category,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const nextComplaint = await complaintModel.getComplaintById(complaintId, { societyId });

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "UPDATE",
      resourceType: "complaint",
      resourceId: complaintId,
      details: `Complaint status updated to ${status}`,
      oldValues: complaint,
      newValues: nextComplaint,
      status: "success",
      request: req,
      societyId: req.user.society_id || null,
      builderId: req.user.builder_id || null,
    });

    res.json({
      success: true,
      message: "Complaint status updated",
      data: nextComplaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function archiveComplaint(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const complaintId = Number(req.params.id);
    const complaint = await complaintModel.getComplaintById(complaintId, { societyId });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const archived = await complaintModel.archiveComplaint({ complaintId, archivedBy: req.user.id });
    if (!archived) {
      return res.status(400).json({ success: false, message: "Complaint could not be archived" });
    }

    const updated = await complaintModel.getComplaintById(complaintId, { societyId });

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "ARCHIVE",
      resourceType: "complaint",
      resourceId: complaintId,
      details: `Complaint archived by ${req.user.name || req.user.email || req.user.id}`,
      oldValues: complaint,
      newValues: updated,
      status: "success",
      request: req,
      societyId: req.user.society_id || null,
      builderId: req.user.builder_id || null,
    });

    res.json({ success: true, message: "Complaint archived successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function restoreComplaint(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const complaintId = Number(req.params.id);
    const complaint = await complaintModel.getComplaintById(complaintId, { societyId });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const restored = await complaintModel.restoreComplaint({ complaintId, restoredBy: req.user.id });
    if (!restored) {
      return res.status(400).json({ success: false, message: "Complaint could not be restored" });
    }

    const updated = await complaintModel.getComplaintById(complaintId, { societyId });

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "RESTORE",
      resourceType: "complaint",
      resourceId: complaintId,
      details: `Complaint restored by ${req.user.name || req.user.email || req.user.id}`,
      oldValues: complaint,
      newValues: updated,
      status: "success",
      request: req,
      societyId: req.user.society_id || null,
      builderId: req.user.builder_id || null,
    });

    res.json({ success: true, message: "Complaint restored successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function deleteComplaint(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const complaintId = Number(req.params.id);
    const { reason } = req.body;
    const complaint = await complaintModel.getComplaintById(complaintId, { societyId });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const deleted = await complaintModel.deleteComplaint({ complaintId, deletedBy: req.user.id, reason });
    if (!deleted) {
      return res.status(400).json({ success: false, message: "Complaint could not be deleted" });
    }

    const updated = await complaintModel.getComplaintById(complaintId, { societyId });

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "DELETE",
      resourceType: "complaint",
      resourceId: complaintId,
      details: reason ? `Complaint deleted: ${reason}` : "Complaint deleted",
      oldValues: complaint,
      newValues: updated,
      status: "success",
      request: req,
      societyId: req.user.society_id || null,
      builderId: req.user.builder_id || null,
    });

    res.json({ success: true, message: "Complaint marked as deleted", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function addComment(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const complaintId = Number(req.params.id);
    const { comment } = req.body;

    if (!complaintId || !comment) {
      return res.status(400).json({
        success: false,
        message: "complaint id and comment are required",
      });
    }

    const complaint = await complaintModel.getComplaintById(complaintId, { societyId });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const isAdminOrStaff = ["admin", "secretary", "staff"].includes(req.user.role);
    const isOwner = complaint.resident_id === req.user.id;

    if (!isAdminOrStaff && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Forbidden to comment on this complaint",
      });
    }

    await complaintModel.createComment({
      complaintId,
      userId: req.user.id,
      comment,
    });

    const updatedComplaint = await complaintModel.getComplaintById(complaintId, { societyId });
    const comments = await complaintModel.getCommentsByComplaintIds([complaintId]);

    res.status(201).json({
      success: true,
      message: "Comment added",
      data: {
        ...updatedComplaint,
        comments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  raiseComplaint,
  getAllComplaints,
  getMyComplaints,
  updateComplaintStatus,
  archiveComplaint,
  restoreComplaint,
  deleteComplaint,
  addComment,
};
