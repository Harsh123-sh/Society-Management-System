const noticeModel = require("../models/noticeModel");
const notificationModel = require("../models/notificationModel");
const auditModel = require("../models/auditModel");

async function createNotice(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const { title, message, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "title and message are required",
      });
    }

    const noticeId = await noticeModel.createNotice({
      title,
      message,
      createdBy: req.user.id,
      societyId,
      expiresAt: expiresAt || null,
    });

    const notice = await noticeModel.getNoticeById(noticeId, { societyId });

    await notificationModel.createNotification({
      targetRole: "all",
      title: `New notice: ${title}`,
      message,
      priority: "medium",
      category: "event_reminder",
      relatedType: "notice",
      relatedId: noticeId,
      deepLink: `/notices/${noticeId}`,
    });

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "CREATE",
      resourceType: "notice",
      resourceId: noticeId,
      details: `Notice created by ${req.user.name || req.user.email || req.user.id}`,
      oldValues: null,
      newValues: notice,
      status: "success",
      request: req,
      societyId: req.user.society_id || null,
      builderId: req.user.builder_id || null,
    });

    res.status(201).json({
      success: true,
      message: "Notice posted successfully",
      data: notice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getNotices(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    await noticeModel.archiveExpiredNotices(societyId);
    const notices = await noticeModel.getAllNotices({ societyId });
    res.json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function archiveNotice(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const noticeId = Number(req.params.id);
    const notice = await noticeModel.getNoticeById(noticeId, { societyId });
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    const archived = await noticeModel.archiveNotice({ noticeId, archivedBy: req.user.id });
    if (!archived) {
      return res.status(400).json({ success: false, message: "Notice could not be archived" });
    }

    const updated = await noticeModel.getNoticeById(noticeId, { societyId });

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "ARCHIVE",
      resourceType: "notice",
      resourceId: noticeId,
      details: `Notice archived by ${req.user.name || req.user.email || req.user.id}`,
      oldValues: notice,
      newValues: updated,
      status: "success",
      request: req,
      societyId: req.user.society_id || null,
      builderId: req.user.builder_id || null,
    });

    res.json({ success: true, message: "Notice archived successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function restoreNotice(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const noticeId = Number(req.params.id);
    const notice = await noticeModel.getNoticeById(noticeId, { societyId });
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    const restored = await noticeModel.restoreNotice({ noticeId, restoredBy: req.user.id });
    if (!restored) {
      return res.status(400).json({ success: false, message: "Notice could not be restored" });
    }

    const updated = await noticeModel.getNoticeById(noticeId, { societyId });

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "RESTORE",
      resourceType: "notice",
      resourceId: noticeId,
      details: `Notice restored by ${req.user.name || req.user.email || req.user.id}`,
      oldValues: notice,
      newValues: updated,
      status: "success",
      request: req,
      societyId: req.user.society_id || null,
      builderId: req.user.builder_id || null,
    });

    res.json({ success: true, message: "Notice restored successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function deleteNotice(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const noticeId = Number(req.params.id);
    const { reason } = req.body;
    const notice = await noticeModel.getNoticeById(noticeId, { societyId });
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    const deleted = await noticeModel.deleteNotice({ noticeId, deletedBy: req.user.id, reason });
    if (!deleted) {
      return res.status(400).json({ success: false, message: "Notice could not be deleted" });
    }

    const updated = await noticeModel.getNoticeById(noticeId, { societyId });

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "DELETE",
      resourceType: "notice",
      resourceId: noticeId,
      details: reason ? `Notice deleted: ${reason}` : "Notice deleted",
      oldValues: notice,
      newValues: updated,
      status: "success",
      request: req,
      societyId: req.user.society_id || null,
      builderId: req.user.builder_id || null,
    });

    res.json({ success: true, message: "Notice marked as deleted", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  createNotice,
  getNotices,
  archiveNotice,
  restoreNotice,
  deleteNotice,
};
