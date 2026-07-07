const securityModel = require("../models/securityModel");
const visitorModel = require("../models/visitorModel");

function getSocietyId(req) {
  return req.user?.societyId || req.user?.society_id || null;
}

function isAdminOrSecretary(role) {
  return role === "admin" || role === "secretary";
}

async function resolveResidentSelection(req, { residentId, flatId }) {
  const societyId = getSocietyId(req);
  if (!societyId || !residentId || !flatId) {
    return null;
  }

  return securityModel.getResidentSelection({
    societyId,
    residentId: Number(residentId),
    flatId: Number(flatId),
  });
}

async function createEntryNotifications({ societyId, residentId, title, message, relatedType, relatedId }) {
  await Promise.allSettled([
    securityModel.createNotification({
      societyId,
      targetRole: "security",
      title,
      message,
      priority: "medium",
      relatedType,
      relatedId,
    }),
    securityModel.createNotification({
      societyId,
      targetRole: "admin",
      title,
      message,
      priority: "medium",
      relatedType,
      relatedId,
    }),
    residentId
      ? securityModel.createNotification({
          societyId,
          targetRole: "resident",
          targetUserId: residentId,
          title,
          message,
          priority: "medium",
          relatedType,
          relatedId,
        })
      : Promise.resolve(),
  ]);
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
    const data = await securityModel.getDashboardSummary(req.user.id, req.user.role, req.user.societyId || req.user.society_id);
    return res.json({ success: true, data });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

  // Search residents for security guard (only within guard's society)
  async function searchResidents(req, res) {
    try {
      const societyId = getSocietyId(req);
      if (!societyId) {
        return res.status(400).json({ success: false, message: "Society context is required." });
      }

      const q = req.query.query ? String(req.query.query).trim() : "";
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const rows = await securityModel.searchResidents({ societyId, query: q, limit });
      return res.json({ success: true, data: rows });
    } catch (error) {
      console.error("[securityController.searchResidents]", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

async function checkIn(req, res) {
  try {
    const societyId = getSocietyId(req);
    if (!societyId) {
      return res.status(400).json({ success: false, message: "Society context is required for attendance." });
    }
    const attendance = await securityModel.checkIn(req.user.id, societyId, req.body.notes);
    await securityModel.createNotification({
      targetRole: "admin",
      title: "Security check-in",
      message: `Security user ${req.user.email} checked in`,
      priority: "low",
      relatedType: "attendance",
      relatedId: attendance?.id || null,
    });
    return res.json({ success: true, message: "Checked in successfully.", data: attendance });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Internal server error" });
  }
}

async function checkOut(req, res) {
  try {
    const societyId = getSocietyId(req);
    if (!societyId) {
      return res.status(400).json({ success: false, message: "Society context is required for attendance." });
    }
    const attendance = await securityModel.checkOut(req.user.id, societyId, req.body.notes);
    return res.json({ success: true, message: "Checked out successfully.", data: attendance });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Internal server error" });
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

async function checkInVisitor(req, res) {
  try {
    const societyId = getSocietyId(req);
    const {
      visitorName,
      visitorEmail,
      phone,
      visitorMobile,
      purpose,
      visitorCount,
      numberOfVisitors,
      residentId,
      flatId,
      photoBase64,
    } = req.body;

    const normalizedName = String(visitorName || "").trim();
    const normalizedMobile = String(phone || visitorMobile || "").trim();
    const normalizedPurpose = String(purpose || "").trim();
    const count = Number(visitorCount || numberOfVisitors || 1);
    const uploadedPhotoUrl = req.file ? `/uploads/visitors/${req.file.filename}` : null;

    if (!societyId) {
      return res.status(400).json({ success: false, message: "Society context is required." });
    }
    if (!normalizedName || !normalizedMobile || !normalizedPurpose || !Number.isFinite(count) || count < 1) {
      return res.status(400).json({ success: false, message: "Visitor name, mobile, purpose and number of visitors are required." });
    }
    if (!uploadedPhotoUrl && !String(photoBase64 || "").trim()) {
      return res.status(400).json({ success: false, message: "Visitor photo is required." });
    }

    const resident = await resolveResidentSelection(req, { residentId, flatId });
    if (!resident) {
      return res.status(400).json({ success: false, message: "Resident not found or does not belong to this society." });
    }

    const entry = await visitorModel.createGuardVisitorEntry({
      visitorName: normalizedName,
      visitorEmail: visitorEmail ? String(visitorEmail).trim().toLowerCase() : null,
      phone: normalizedMobile,
      purpose: normalizedPurpose,
      visitorCount: count,
      flatId: resident.flat_id,
      residentId: resident.resident_id,
      residentName: resident.resident_name,
      residentPhone: resident.resident_phone,
      guardId: req.user.id,
      societyId,
      photoUrl: uploadedPhotoUrl || String(photoBase64 || "").trim(),
    });

    await createEntryNotifications({
      societyId,
      residentId: resident.resident_id,
      title: "Visitor entry saved",
      message: `${normalizedName} checked in for ${resident.resident_name} at flat ${resident.flat_number}.`,
      relatedType: "visitor",
      relatedId: entry?.id || null,
    });

    return res.status(201).json({ success: true, message: "Entry saved successfully.", data: entry });
  } catch (error) {
    console.error("[securityController.checkInVisitor]", error);
    return res.status(500).json({ success: false, message: "Unable to save visitor entry. Please try again." });
  }
}

async function listVisitors(req, res) {
  try {
    const societyId = getSocietyId(req);
    if (!societyId) {
      return res.status(400).json({ success: false, message: "Society context is required." });
    }

    const rows = await visitorModel.getVisitorLogs({
      societyId,
      search: req.query.search ? String(req.query.search).trim() : "",
      status: req.query.status ? String(req.query.status).trim() : "",
      fromDate: req.query.fromDate ? String(req.query.fromDate).trim() : "",
      toDate: req.query.toDate ? String(req.query.toDate).trim() : "",
    });
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("[securityController.listVisitors]", error);
    return res.status(500).json({ success: false, message: "Unable to load visitor entries." });
  }
}

async function checkOutVisitor(req, res) {
  try {
    const societyId = getSocietyId(req);
    const id = Number(req.params.id);
    if (!societyId || !id) {
      return res.status(400).json({ success: false, message: "Valid visitor id is required." });
    }

    const rows = await visitorModel.getVisitorLogs({ societyId });
    const visitor = rows.find((item) => Number(item.id) === id);
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor entry not found in this society." });
    }

    const updated = await visitorModel.markVisitorExit(id);
    if (!updated) {
      return res.status(400).json({ success: false, message: "Visitor is already checked out." });
    }

    return res.json({ success: true, message: "Visitor checked out successfully.", data: { id } });
  } catch (error) {
    console.error("[securityController.checkOutVisitor]", error);
    return res.status(500).json({ success: false, message: "Unable to check out visitor." });
  }
}

async function createDelivery(req, res) {
  try {
    const societyId = getSocietyId(req);
    const {
      flatId,
      residentId,
      deliveryType,
      packageId,
      recipientName,
      deliveryPartner,
      courierCompany,
      packageDetails,
      status,
      notes,
    } = req.body;
    if (!deliveryType) {
      return res.status(400).json({ success: false, message: "deliveryType is required" });
    }
    if (!societyId) {
      return res.status(400).json({ success: false, message: "Society context is required." });
    }

    const resident = residentId || flatId ? await resolveResidentSelection(req, { residentId, flatId }) : null;
    if ((residentId || flatId) && !resident) {
      return res.status(400).json({ success: false, message: "Resident not found or does not belong to this society." });
    }

    const id = await securityModel.createDelivery({
      societyId,
      guardId: req.user.id,
      residentId: resident?.resident_id || null,
      flatId: resident?.flat_id || null,
      deliveryType,
      packageId,
      recipientName: recipientName || resident?.resident_name || null,
      deliveryPartner,
      courierCompany,
      packageDetails,
      status,
      notes,
      loggedBy: req.user.id,
    });

    const delivery = await securityModel.getDeliveryById(id);
    await createEntryNotifications({
      societyId,
      residentId: resident?.resident_id || null,
      title: "Delivery logged",
      message: `${deliveryType} package ${packageId || ""} logged${resident ? ` for ${resident.resident_name}` : ""}.`,
      relatedType: "delivery",
      relatedId: id,
    });
    return res.status(201).json({ success: true, message: "Entry saved successfully.", data: delivery });
  } catch (error) {
    console.error("[securityController.createDelivery]", error);
    return res.status(500).json({ success: false, message: "Unable to save delivery entry. Please try again." });
  }
}

async function listDeliveries(req, res) {
  try {
    const societyId = getSocietyId(req);
    const rows = await securityModel.listDeliveries({
      status: req.query.status ? String(req.query.status).toLowerCase() : "",
      search: req.query.search ? String(req.query.search).trim() : "",
      societyId,
    });
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("[securityController.listDeliveries]", error);
    return res.status(500).json({ success: false, message: "Unable to load deliveries." });
  }
}

async function updateDeliveryStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").trim().toLowerCase();
    if (!id || !["pending", "pending_handover", "received", "completed", "dispatched", "returned"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid id and status are required",
      });
    }

    const updated = await securityModel.updateDeliveryStatus({ id, status, societyId: getSocietyId(req) });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Delivery not found" });
    }

    const delivery = await securityModel.getDeliveryById(id);
    return res.json({ success: true, message: "Delivery status updated", data: delivery });
  } catch (error) {
    console.error("[securityController.updateDeliveryStatus]", error);
    return res.status(500).json({ success: false, message: "Unable to update delivery status." });
  }
}

async function createVehicleEntry(req, res) {
  try {
    const societyId = getSocietyId(req);
    const { vehicleNumber, vehicleType, entryType, guestName, visitorName, idProofNumber, residentId, flatId } = req.body;
    if (!societyId) {
      return res.status(400).json({ success: false, message: "Society context is required." });
    }
    if (!vehicleNumber || !vehicleType) {
      return res.status(400).json({ success: false, message: "Vehicle number and vehicle type are required." });
    }

    const resident = await resolveResidentSelection(req, { residentId, flatId });
    if (!resident) {
      return res.status(400).json({ success: false, message: "Resident not found or does not belong to this society." });
    }

    const normalizedEntryType = String(entryType || "guest").toLowerCase() === "resident" ? "resident" : "guest";
    if (normalizedEntryType === "guest" && !String(guestName || visitorName || "").trim()) {
      return res.status(400).json({ success: false, message: "Guest name is required for guest vehicle entry." });
    }

    const id = await securityModel.createVehicleEntry({
      societyId,
      guardId: req.user.id,
      residentId: resident.resident_id,
      flatId: resident.flat_id,
      vehicleNumber: String(vehicleNumber).trim().toUpperCase(),
      vehicleType,
      entryType: normalizedEntryType,
      guestName: normalizedEntryType === "guest" ? String(guestName || visitorName || "").trim() : null,
      idProofNumber: idProofNumber ? String(idProofNumber).trim() : null,
    });

    const entry = await securityModel.getVehicleEntryById(id, societyId);
    await createEntryNotifications({
      societyId,
      residentId: resident.resident_id,
      title: "Vehicle entry saved",
      message: `${entry.vehicle_number} logged for flat ${resident.flat_number}.`,
      relatedType: "vehicle",
      relatedId: id,
    });

    return res.status(201).json({ success: true, message: "Entry saved successfully.", data: entry });
  } catch (error) {
    console.error("[securityController.createVehicleEntry]", error);
    return res.status(500).json({ success: false, message: "Unable to save vehicle entry. Please try again." });
  }
}

async function listVehicles(req, res) {
  try {
    const societyId = getSocietyId(req);
    if (!societyId) {
      return res.status(400).json({ success: false, message: "Society context is required." });
    }
    const rows = await securityModel.listVehicleEntries({
      societyId,
      search: req.query.search ? String(req.query.search).trim() : "",
    });
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("[securityController.listVehicles]", error);
    return res.status(500).json({ success: false, message: "Unable to load vehicles." });
  }
}

async function createVisitorRequest(req, res) {
  try {
    const { visitorName, phone, purpose, flatId, wing, flatNumber, expectedAt, notes } = req.body;
    if (!visitorName || !purpose) {
      return res.status(400).json({ success: false, message: "visitorName and purpose are required" });
    }
    const societyId = req.user.societyId || req.user.society_id;
    if (!societyId) {
      return res.status(400).json({ success: false, message: "Society context is required." });
    }

    let resolvedFlatId = flatId ? Number(flatId) : null;
    if (!resolvedFlatId) {
      if (!wing || !flatNumber) {
        return res.status(400).json({ success: false, message: "wing and flatNumber are required for resident approval." });
      }
      const visitorModel = require("../models/visitorModel");
      const flat = await visitorModel.getFlatByWingAndFlatNumber({
        societyId,
        wing: String(wing).trim().toUpperCase(),
        flatNumber: String(flatNumber).trim(),
      });
      if (!flat) {
        return res.status(404).json({ success: false, message: "Resident flat not found in your society." });
      }
      resolvedFlatId = flat.id;
    }

    const id = await securityModel.createVisitorApprovalRequest({
      visitorName,
      phone,
      purpose,
      flatId: resolvedFlatId,
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
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
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
      societyId: getSocietyId(req),
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
  checkInVisitor,
  listVisitors,
  checkOutVisitor,
  createDelivery,
  listDeliveries,
  updateDeliveryStatus,
  createVehicleEntry,
  listVehicles,
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
  searchResidents,
};
