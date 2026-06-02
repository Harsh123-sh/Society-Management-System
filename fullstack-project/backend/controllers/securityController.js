const securityModel = require("../models/securityModel");

function isAdminOrSecretary(role) {
  return role === "admin" || role === "secretary";
}

async function getProfile(req, res) {
  try {
    const profile = await securityModel.getSecurityProfile(req.user.id);

    if (!profile) {
      return res.status(404).json({ success: false, message: "Security profile not found" });
    }

    return res.json({ success: true, data: profile });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getDashboard(req, res) {
  try {
    const data = await securityModel.getDashboardSummary(req.user.id, req.user.role);
    return res.json({ success: true, data });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function checkIn(req, res) {
  try {
    const attendance = await securityModel.checkIn(req.user.id, req.body.notes);
    await securityModel.createNotification({
      targetRole: "admin",
      title: "Security check-in",
      message: `Security user ${req.user.email} checked in`,
      priority: "low",
      relatedType: "attendance",
      relatedId: attendance?.id || null,
    });
    return res.json({ success: true, message: "Checked in", data: attendance });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function checkOut(req, res) {
  try {
    const attendance = await securityModel.checkOut(req.user.id, req.body.notes);
    return res.json({ success: true, message: "Checked out", data: attendance });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createLeaveRequest(req, res) {
  try {
    const { fromDate, toDate, reason } = req.body;
    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "fromDate, toDate and reason are required",
      });
    }

    const id = await securityModel.createLeaveRequest({
      userId: req.user.id,
      fromDate,
      toDate,
      reason,
    });
    const leaveRequest = await securityModel.getLeaveRequestById(id);

    await securityModel.createNotification({
      targetRole: "admin",
      title: "New leave request",
      message: `Security user ${req.user.email} submitted leave request`,
      priority: "medium",
      relatedType: "leave_request",
      relatedId: id,
    });

    return res.status(201).json({
      success: true,
      message: "Leave request submitted",
      data: leaveRequest,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getMyLeaveRequests(req, res) {
  try {
    const rows = await securityModel.getMyLeaveRequests(req.user.id);
    return res.json({ success: true, data: rows });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function reviewLeaveRequest(req, res) {
  try {
    if (!isAdminOrSecretary(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const leaveRequestId = Number(req.params.id);
    const status = String(req.body.status || "").trim().toLowerCase();

    if (!leaveRequestId || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid leave request id and status (approved/rejected) are required",
      });
    }

    const updated = await securityModel.reviewLeaveRequest({
      leaveRequestId,
      status,
      reviewedBy: req.user.id,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Pending leave request not found" });
    }

    const leaveRequest = await securityModel.getLeaveRequestById(leaveRequestId);

    await securityModel.createNotification({
      targetUserId: leaveRequest.security_user_id,
      targetRole: "security",
      title: "Leave request reviewed",
      message: `Your leave request has been ${status}`,
      priority: "medium",
      relatedType: "leave_request",
      relatedId: leaveRequestId,
    });

    return res.json({ success: true, message: `Leave request ${status}`, data: leaveRequest });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getMyShifts(req, res) {
  try {
    const rows = await securityModel.getMyShifts(
      req.user.id,
      req.query.fromDate ? String(req.query.fromDate) : "",
      req.query.toDate ? String(req.query.toDate) : ""
    );
    return res.json({ success: true, data: rows });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createShift(req, res) {
  try {
    if (!isAdminOrSecretary(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { securityUserId, shiftDate, startTime, endTime, shiftType, notes } = req.body;
    if (!securityUserId || !shiftDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "securityUserId, shiftDate, startTime and endTime are required",
      });
    }

    const shiftId = await securityModel.createShift({
      securityUserId: Number(securityUserId),
      shiftDate,
      startTime,
      endTime,
      shiftType,
      notes,
      createdBy: req.user.id,
    });

    await securityModel.createNotification({
      targetUserId: Number(securityUserId),
      targetRole: "security",
      title: "New shift assigned",
      message: `Shift assigned for ${shiftDate} (${startTime} - ${endTime})`,
      priority: "medium",
      relatedType: "shift",
      relatedId: shiftId,
    });

    return res.status(201).json({ success: true, message: "Shift assigned", data: { id: shiftId } });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getHolidays(req, res) {
  try {
    const rows = await securityModel.getHolidays();
    return res.json({ success: true, data: rows });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createHoliday(req, res) {
  try {
    if (!isAdminOrSecretary(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { title, holidayDate, description, isOptional } = req.body;
    if (!title || !holidayDate) {
      return res.status(400).json({ success: false, message: "title and holidayDate are required" });
    }

    const id = await securityModel.createHoliday({
      title,
      holidayDate,
      description,
      isOptional,
      createdBy: req.user.id,
    });

    return res.status(201).json({ success: true, message: "Holiday created", data: { id } });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createDelivery(req, res) {
  try {
    const { flatId, deliveryType, packageId, recipientName, deliveryPartner, status, notes } = req.body;
    if (!deliveryType) {
      return res.status(400).json({ success: false, message: "deliveryType is required" });
    }

    const id = await securityModel.createDelivery({
      flatId: flatId ? Number(flatId) : null,
      deliveryType,
      packageId,
      recipientName,
      deliveryPartner,
      status,
      notes,
      loggedBy: req.user.id,
    });

    const delivery = await securityModel.getDeliveryById(id);
    return res.status(201).json({ success: true, message: "Delivery logged", data: delivery });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function listDeliveries(req, res) {
  try {
    const rows = await securityModel.listDeliveries({
      status: req.query.status ? String(req.query.status).toLowerCase() : "",
      search: req.query.search ? String(req.query.search).trim() : "",
    });
    return res.json({ success: true, data: rows });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateDeliveryStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").trim().toLowerCase();
    if (!id || !["pending", "received", "dispatched", "returned"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid id and status (pending/received/dispatched/returned) are required",
      });
    }

    const updated = await securityModel.updateDeliveryStatus({ id, status });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Delivery not found" });
    }

    const delivery = await securityModel.getDeliveryById(id);
    return res.json({ success: true, message: "Delivery status updated", data: delivery });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createVisitorRequest(req, res) {
  try {
    const { visitorName, phone, purpose, flatId, expectedAt, notes } = req.body;
    if (!visitorName || !purpose) {
      return res.status(400).json({ success: false, message: "visitorName and purpose are required" });
    }

    const id = await securityModel.createVisitorApprovalRequest({
      visitorName,
      phone,
      purpose,
      flatId: flatId ? Number(flatId) : null,
      expectedAt,
      requestedBy: req.user.id,
      notes,
    });

    await securityModel.createNotification({
      targetRole: "admin",
      title: "Visitor approval request",
      message: `New visitor request: ${visitorName}`,
      priority: "high",
      relatedType: "visitor_approval",
      relatedId: id,
    });

    return res.status(201).json({ success: true, message: "Visitor request created", data: { id } });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function listVisitorRequests(req, res) {
  try {
    const rows = await securityModel.listVisitorApprovalRequests({
      status: req.query.status ? String(req.query.status).toLowerCase() : "",
    });
    return res.json({ success: true, data: rows });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateVisitorRequestStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").trim().toLowerCase();
    if (!id || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid id and status (approved/rejected) are required",
      });
    }

    const updated = await securityModel.updateVisitorRequestStatus({
      id,
      status,
      decisionBy: req.user.id,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Visitor request not found" });
    }

    return res.json({ success: true, message: `Visitor request ${status}` });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function markVisitorCheckIn(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Valid id is required" });
    }

    const updated = await securityModel.markVisitorCheckIn(id);
    if (!updated) {
      return res.status(400).json({ success: false, message: "Only approved requests can check in" });
    }

    return res.json({ success: true, message: "Visitor checked in" });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function markVisitorCheckOut(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Valid id is required" });
    }

    const updated = await securityModel.markVisitorCheckOut(id);
    if (!updated) {
      return res.status(400).json({ success: false, message: "Only checked-in visitors can check out" });
    }

    return res.json({ success: true, message: "Visitor checked out" });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function listNotifications(req, res) {
  try {
    const rows = await securityModel.listNotificationsForUser({
      userId: req.user.id,
      role: req.user.role,
      onlyUnread: String(req.query.onlyUnread || "").toLowerCase() === "true",
    });
    return res.json({ success: true, data: rows });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function markNotificationRead(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Valid id is required" });
    }

    const updated = await securityModel.markNotificationRead(id, req.user.id, req.user.role);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, message: "Notification marked as read" });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createEmergencyAlert(req, res) {
  try {
    const { alertType, severity, message, location } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const id = await securityModel.createEmergencyAlert({
      triggeredBy: req.user.id,
      alertType,
      severity,
      message,
      location,
    });

    await securityModel.createNotification({
      targetRole: "all",
      title: "Emergency alert",
      message,
      priority: severity || "high",
      category: "emergency_alert",
      relatedType: "emergency_alert",
      relatedId: id,
    });

    return res.status(201).json({ success: true, message: "Emergency alert created", data: { id } });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function listEmergencyAlerts(req, res) {
  try {
    const rows = await securityModel.listEmergencyAlerts({
      status: req.query.status ? String(req.query.status).toLowerCase() : "",
    });
    return res.json({ success: true, data: rows });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function acknowledgeEmergencyAlert(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Valid id is required" });
    }

    const updated = await securityModel.acknowledgeEmergencyAlert({ id, userId: req.user.id });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Active alert not found" });
    }

    return res.json({ success: true, message: "Alert acknowledged" });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function resolveEmergencyAlert(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Valid id is required" });
    }

    if (!isAdminOrSecretary(req.user.role) && req.user.role !== "security") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const updated = await securityModel.resolveEmergencyAlert({ id, userId: req.user.id });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    return res.json({ success: true, message: "Alert resolved" });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  getProfile,
  getDashboard,
  checkIn,
  checkOut,
  createLeaveRequest,
  getMyLeaveRequests,
  reviewLeaveRequest,
  getMyShifts,
  createShift,
  getHolidays,
  createHoliday,
  createDelivery,
  listDeliveries,
  updateDeliveryStatus,
  createVisitorRequest,
  listVisitorRequests,
  updateVisitorRequestStatus,
  markVisitorCheckIn,
  markVisitorCheckOut,
  listNotifications,
  markNotificationRead,
  createEmergencyAlert,
  listEmergencyAlerts,
  acknowledgeEmergencyAlert,
  resolveEmergencyAlert,
};
