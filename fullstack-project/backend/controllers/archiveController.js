const archiveModel = require("../models/archiveModel");
const auditModel = require("../models/auditModel");

function parseArchiveFilters(query = {}) {
  return {
    search: query.search ? String(query.search).trim() : "",
    status: query.status ? String(query.status).trim() : "all",
    category: query.category ? String(query.category).trim() : "",
    flatNumber: query.flatNumber ? String(query.flatNumber).trim() : "",
    residentId: query.residentId ? Number(query.residentId) : null,
    fromDate: query.fromDate ? String(query.fromDate).trim() : "",
    toDate: query.toDate ? String(query.toDate).trim() : "",
  };
}

async function getArchiveCenter(req, res) {
  try {
    const filters = parseArchiveFilters(req.query);
    const [stats, retentionRules, complaints, notices, auditLogs] = await Promise.all([
      archiveModel.getArchiveStats({ societyId: req.user.society_id || null }),
      archiveModel.getRetentionRules(),
      archiveModel.getArchivedComplaints({ ...filters, societyId: req.user.society_id || null }),
      archiveModel.getArchivedNotices({ ...filters, societyId: req.user.society_id || null }),
      archiveModel.getRecentAuditLogs({ limit: 20, societyId: req.user.society_id || null }),
    ]);

    res.json({
      success: true,
      data: {
        stats,
        retentionRules,
        complaints,
        notices,
        auditLogs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateRetentionRule(req, res) {
  try {
    const { resourceType } = req.params;
    const retentionDays = Number(req.body.retentionDays);
    const archiveAfterDays = Number(req.body.archiveAfterDays);
    const autoArchiveEnabled = req.body.autoArchiveEnabled !== undefined ? Boolean(req.body.autoArchiveEnabled) : true;
    const allowPermanentDelete = req.body.allowPermanentDelete !== undefined ? Boolean(req.body.allowPermanentDelete) : false;

    if (!resourceType || Number.isNaN(retentionDays) || Number.isNaN(archiveAfterDays)) {
      return res.status(400).json({ success: false, message: "retention days and archive after days are required" });
    }

    await archiveModel.updateRetentionRule({
      resourceType,
      retentionDays,
      archiveAfterDays,
      autoArchiveEnabled,
      allowPermanentDelete,
      updatedBy: req.user.id,
    });

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "UPDATE",
      resourceType: "retention_rule",
      resourceId: resourceType,
      details: `Retention rule updated for ${resourceType}`,
      oldValues: null,
      newValues: { resourceType, retentionDays, archiveAfterDays, autoArchiveEnabled, allowPermanentDelete },
      status: "success",
      request: req,
      societyId: req.user.society_id || null,
      builderId: req.user.builder_id || null,
    });

    res.json({ success: true, message: "Retention rule updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  getArchiveCenter,
  updateRetentionRule,
};
