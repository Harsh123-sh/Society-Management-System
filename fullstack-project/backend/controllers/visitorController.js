const visitorModel = require("../models/visitorModel");
const ownerDashboardModel = require("../models/ownerDashboardModel");
const notificationModel = require("../models/notificationModel");
const { uploadVisitorPhoto } = require("../utils/cloudinary");
const { sendVisitorArrivalEmails } = require("../utils/mailer");
const { emitVisitorEvent } = require("../sockets/chatSocket");

const MIN_FACE_CONFIDENCE = Number(process.env.MIN_FACE_CONFIDENCE || 0.8);

function emitSafe(eventName, payload) {
  try {
    emitVisitorEvent?.(eventName, payload);
  } catch (_error) {
    // realtime is best-effort
  }
}

async function createVisitorArrivalNotification(visitor, details = {}) {
  try {
    const title = visitor.blacklist_flag ? "Blacklisted visitor blocked" : "Visitor arrived";
    const message = visitor.blacklist_flag
      ? `${visitor.visitor_name} matched blacklist detection at the gate`
      : `${visitor.visitor_name} arrived for ${visitor.purpose || "a visit"}`;

    await notificationModel.createNotification({
      targetRole: "security",
      title,
      message,
      priority: visitor.blacklist_flag ? "critical" : "high",
      category: "visitor_alert",
      relatedType: "visitor",
      relatedId: visitor.id,
    });

    if (details.ownerId) {
      await notificationModel.createNotification({
        targetRole: "resident",
        targetUserId: details.ownerId,
        title: "Visitor approved",
        message: `${visitor.visitor_name} has been approved for your flat`,
        priority: "medium",
        category: "visitor_alert",
        relatedType: "visitor_approval",
        relatedId: visitor.preapproval_id || null,
      });
    }
  } catch (_error) {
    // notification creation is best-effort
  }
}

async function addVisitorEntry(req, res) {
  try {
    const {
      visitorName,
      visitorEmail,
      phone,
      purpose,
      personToMeet,
      vehicleNumber,
      flatId,
      preapprovalId,
      photoBase64,
      flatNumber,
      wing,
      faceDetectionConfidence,
      isFaceValid,
      qrPassToken,
      otpCode,
      faceSignature,
      faceCaptureUrl,
    } = req.body;

    if (!photoBase64) {
      return res.status(400).json({ success: false, message: "Please capture visitor face before check-in." });
    }

    const parsedConfidence = faceDetectionConfidence === undefined || faceDetectionConfidence === null || faceDetectionConfidence === ""
      ? null
      : Number(faceDetectionConfidence);

    if (isFaceValid === false) {
      return res.status(400).json({
        success: false,
        message: "Face validation failed. Please capture a clear centered face image.",
      });
    }

    if (parsedConfidence !== null && (!Number.isFinite(parsedConfidence) || parsedConfidence < MIN_FACE_CONFIDENCE)) {
      return res.status(400).json({
        success: false,
        message: "Face validation failed. Please capture a clear centered face image.",
      });
    }

    let visitor = null;
    let normalizedVisitorName = String(visitorName || "").trim();
    let normalizedVisitorEmail = visitorEmail ? String(visitorEmail).trim().toLowerCase() : null;
    let normalizedPhone = String(phone || "").trim();
    let normalizedPurpose = String(purpose || "Visitor Entry").trim();
    let normalizedPersonToMeet = String(personToMeet || "").trim() || null;
    let normalizedVehicleNumber = String(vehicleNumber || "").trim() || null;
    let normalizedFlatId = flatId ? Number(flatId) : null;
    let normalizedPreapprovalId = preapprovalId ? Number(preapprovalId) : null;
    let normalizedFlatNumber = flatNumber ? String(flatNumber).trim() : "";
    let normalizedWing = wing ? String(wing).trim().toUpperCase() : "";
    const computedFaceSignature = visitorModel.createSignature(faceSignature || photoBase64);

    if (normalizedPreapprovalId) {
      const preapproval = await visitorModel.getVisitorPreapprovalById(normalizedPreapprovalId);
      if (!preapproval || preapproval.status !== "approved") {
        return res.status(400).json({ success: false, message: "Valid approved preapprovalId is required" });
      }

      normalizedVisitorName = normalizedVisitorName || preapproval.visitor_name;
      normalizedPhone = normalizedPhone || preapproval.phone;
      normalizedPurpose = normalizedPurpose || preapproval.purpose;
      normalizedVehicleNumber = normalizedVehicleNumber || preapproval.vehicle_number;
      normalizedFlatId = normalizedFlatId || preapproval.flat_id;
    }

    if (!normalizedVisitorName) {
      return res.status(400).json({ success: false, message: "visitorName is required" });
    }

    if (!normalizedFlatId) {
      if (!normalizedFlatNumber || !normalizedWing) {
        return res.status(400).json({ success: false, message: "flatNumber and wing are required" });
      }

      const flat = await visitorModel.getFlatByWingAndFlatNumber({
        societyId: req.user?.society_id,
        builderId: req.user?.builder_id,
        wing: normalizedWing,
        flatNumber: normalizedFlatNumber,
      });
      if (!flat) {
        return res.status(400).json({ success: false, message: "No approved flat found for the provided wing and flat number" });
      }
      normalizedFlatId = flat.id;
    }

    const blacklist = await visitorModel.isBlacklisted({
      visitorName: normalizedVisitorName,
      phone: normalizedPhone,
      faceSignature: computedFaceSignature,
    });

    if (blacklist.blacklisted) {
      const alertId = await visitorModel.createEmergencyAlert({
        triggeredBy: req.user.id,
        alertType: "security",
        severity: "critical",
        message: `Blacklisted visitor attempt: ${normalizedVisitorName}`,
        location: `Wing ${normalizedWing || "NA"} Flat ${normalizedFlatNumber || normalizedFlatId}`,
      });

      emitSafe("visitor:blacklist_detected", {
        alertId,
        visitorName: normalizedVisitorName,
        phone: normalizedPhone,
        reason: blacklist.record?.reason || "Blacklisted match",
      });

      return res.status(403).json({
        success: false,
        message: "Blacklist match detected. Entry blocked and security alerted.",
        data: { blacklist: blacklist.record },
      });
    }

    if (normalizedPreapprovalId && otpCode) {
      const otpResult = await visitorModel.verifyVisitorOtp({
        preapprovalId: normalizedPreapprovalId,
        otpCode,
        verifiedBy: req.user.id,
      });

      if (!otpResult.verified) {
        return res.status(400).json({ success: false, message: otpResult.reason || "OTP verification failed" });
      }
    }

    let photoUrl = null;
    try {
      photoUrl = await uploadVisitorPhoto(photoBase64);
    } catch (uploadError) {
      console.warn("Photo upload failed, storing the captured image in the visitor row only:", uploadError.message);
    }

    const recognition = await visitorModel.recognizeVisitorFace({
      faceCaptureUrl: faceCaptureUrl || photoUrl,
      faceSignature: computedFaceSignature,
      phone: normalizedPhone,
      visitorName: normalizedVisitorName,
      flatId: normalizedFlatId,
    });

    const approvalStatus = normalizedPreapprovalId ? "approved" : "manual_review";
    const visitorId = await visitorModel.createVisitorEntry({
      visitorName: normalizedVisitorName,
      visitorEmail: normalizedVisitorEmail,
      phone: normalizedPhone,
      purpose: normalizedPurpose,
      personToMeet: normalizedPersonToMeet,
      vehicleNumber: normalizedVehicleNumber,
      flatId: normalizedFlatId,
      preapprovalId: normalizedPreapprovalId,
      securityId: req.user.id,
      photoUrl,
      faceCaptureUrl: faceCaptureUrl || photoBase64,
      faceSignature: computedFaceSignature,
      faceMatchConfidence: recognition.confidence,
      approvalStatus,
      blacklistFlag: recognition.matchFound ? 0 : 0,
      qrPassId: null,
      otpVerifiedAt: normalizedPreapprovalId ? new Date() : null,
      societyId: req.user?.societyId || req.user?.society_id || null,
    });

    if (normalizedPreapprovalId) {
      await visitorModel.markPreapprovalVisited(normalizedPreapprovalId);
    }

    const insertedVisitor = await visitorModel.getVisitorById(visitorId);
    const owner = await visitorModel.getFlatOwnerByFlatId(normalizedFlatId);

    try {
      await sendVisitorArrivalEmails({
        ownerEmail: owner?.email || null,
        ownerName: owner?.name || null,
        visitorEmail: normalizedVisitorEmail,
        visitorName: normalizedVisitorName,
        flatNumber: insertedVisitor?.flat_number || normalizedFlatNumber,
        wing: insertedVisitor?.wing || normalizedWing,
      });
    } catch (mailError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Visitor notification email failed:", mailError.message);
      }
    }

    await createVisitorArrivalNotification(insertedVisitor, { ownerId: owner?.id || null });

    emitSafe("visitor:new_entry", {
      visitor: insertedVisitor,
      ownerId: owner?.id || null,
      confidence: recognition.confidence,
      matchFound: recognition.matchFound,
    });

    return res.status(201).json({
      success: true,
      message: "Visitor entry created",
      data: {
        ...insertedVisitor,
        faceRecognition: recognition,
      },
    });
  } catch (error) {
    console.error("Add visitor error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createOwnerPreapproval(req, res) {
  try {
    if (req.user.role !== "resident" || req.user.residentType !== "owner") {
      return res.status(403).json({ success: false, message: "Only owners can pre-approve visitors" });
    }

    const { flatId, visitorName, phone, purpose, visitDate, expectedArrivalTime, vehicleNumber, notes } = req.body;
    const ownerId = req.user.id;
    const ownedProperties = await ownerDashboardModel.getOwnerPropertyRows(ownerId);
    const ownsFlat = ownedProperties.some((item) => item.flat_id === Number(flatId));

    if (!ownsFlat) {
      return res.status(403).json({ success: false, message: "You can pre-approve visitors only for your own properties" });
    }

    const preapprovalId = await visitorModel.createVisitorPreapproval({
      ownerId,
      flatId: Number(flatId),
      visitorName,
      phone,
      purpose,
      visitDate,
      expectedArrivalTime,
      vehicleNumber,
      notes,
    });

    const preapproval = await visitorModel.getVisitorPreapprovalById(preapprovalId);
    emitSafe("visitor:preapproval_created", preapproval);

    return res.status(201).json({ success: true, message: "Visitor pre-approval created (pending)", data: preapproval });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Security: list preapprovals for the guard dashboard
async function listSecurityPreapprovals(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const status = req.query.status || null; // optional filter
    const rows = await visitorModel.listVisitorPreapprovals({ status, societyId });
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to list pre-approvals" });
  }
}

// Security: update preapproval status (approve/reject) and optionally check-in/out
async function updatePreapprovalStatusBySecurity(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, message: "id and status are required" });
    }

    const societyId = req.user?.societyId || req.user?.society_id || null;
    const allowed = ["pending", "approved", "rejected", "checked_in", "checked_out", "expired"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updated = await visitorModel.updateVisitorPreapprovalStatusBySecurity({ id, status, updatedBy: req.user.id, societyId });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Pre-approval not found or not allowed" });
    }

    const preapproval = await visitorModel.getVisitorPreapprovalById(id);
    emitSafe("visitor:preapproval_status_changed", preapproval);
    return res.json({ success: true, message: "Status updated", data: preapproval });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
}

// Security: verify QR token and auto-approve preapproval
async function verifyQrToken(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "token is required" });
    }

    const pass = await visitorModel.getQrPassByToken(token);
    if (!pass) {
      return res.status(404).json({ success: false, message: "QR pass not found" });
    }

    // mark scanned and set preapproval approved
    await visitorModel.markQrPassScanned({ passId: pass.id, scannedBy: req.user.id });
    await visitorModel.updateVisitorPreapprovalStatusBySecurity({ id: pass.preapproval_id, status: "approved", updatedBy: req.user.id, societyId: req.user?.societyId || req.user?.society_id });

    const preapproval = await visitorModel.getVisitorPreapprovalById(pass.preapproval_id);
    emitSafe("visitor:qr_verified", { preapproval, passId: pass.id });

    return res.json({ success: true, message: "QR verified and pre-approval approved", data: { preapproval, pass } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to verify QR" });
  }
}

// Security: check-in from preapproval (creates visitor entry and marks preapproval checked_in)
async function checkInFromPreapproval(req, res) {
  try {
    const preapprovalId = Number(req.params.id);
    if (!preapprovalId) return res.status(400).json({ success: false, message: "preapproval id required" });

    const societyId = req.user?.societyId || req.user?.society_id || null;
    const visitorId = await visitorModel.createVisitorEntryFromPreapproval({
      preapprovalId,
      securityId: req.user.id,
      entryMethod: req.body.entryMethod || "qr",
      photoBase64: String(req.body.photoBase64 || "").trim() || null,
      societyId,
    });
    if (!visitorId) return res.status(404).json({ success: false, message: "Preapproval not found or not approved" });

    const inserted = await visitorModel.getVisitorById(visitorId);
    emitSafe("visitor:checked_in", inserted);
    return res.json({ success: true, message: "Visitor checked in", data: inserted });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to check-in" });
  }
}

// Security: check-out a visitor by visitor id
async function checkOutVisitorBySecurity(req, res) {
  try {
    const visitorId = Number(req.params.id);
    if (!visitorId) return res.status(400).json({ success: false, message: "visitor id required" });

    const ok = await visitorModel.markVisitorCheckOut(visitorId);
    if (!ok) return res.status(404).json({ success: false, message: "Visitor not found or already checked out" });

    const updated = await visitorModel.getVisitorById(visitorId);
    emitSafe("visitor:checked_out", updated);
    return res.json({ success: true, message: "Visitor checked out", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to check-out" });
  }
}

async function getOwnerPreapprovals(req, res) {
  try {
    if (req.user.role !== "resident" || req.user.residentType !== "owner") {
      return res.status(403).json({ success: false, message: "Only owners can access visitor pre-approvals" });
    }

    const rows = await visitorModel.listVisitorPreapprovals({ ownerId: req.user.id, societyId: req.user?.societyId || req.user?.society_id || null });
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Security APIs
async function listSecurityPreapprovals(req, res) {
  try {
    // security can list all preapprovals for their society
    const rows = await visitorModel.listVisitorPreapprovals({ societyId: req.user?.societyId || req.user?.society_id || null });
    if (!rows || !rows.length) {
      return res.json({ success: true, data: [], message: "No pre-approved visitors found." });
    }
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function securityUpdatePreapprovalStatus(req, res) {
  try {
    const preapprovalId = Number(req.params.id);
    const { status } = req.body;
    if (!preapprovalId || !["approved", "rejected"].includes(String(status))) {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    const updated = await visitorModel.updateVisitorPreapprovalStatusBySecurity({ id: preapprovalId, status, updatedBy: req.user.id, societyId: req.user?.societyId || req.user?.society_id || null });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Preapproval not found or cannot be updated" });
    }

    const preapproval = await visitorModel.getVisitorPreapprovalById(preapprovalId);
    emitSafe("visitor:preapproval_updated", preapproval);
    return res.json({ success: true, message: "Preapproval status updated", data: preapproval });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function securityCheckInPreapproval(req, res) {
  try {
    const preapprovalId = Number(req.params.id);
    if (!preapprovalId) {
      return res.status(400).json({ success: false, message: "Valid preapproval id is required" });
    }

    const visitorId = await visitorModel.createVisitorEntryFromPreapproval({ preapprovalId, securityId: req.user.id, entryMethod: req.body.entryMethod || 'guard', societyId: req.user?.societyId || req.user?.society_id || null });
    if (!visitorId) {
      return res.status(404).json({ success: false, message: "Preapproval not found" });
    }

    const visitor = await visitorModel.getVisitorById(visitorId);
    emitSafe("visitor:checked_in", visitor);
    return res.json({ success: true, message: "Visitor checked in", data: visitor });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function securityCheckOutVisitor(req, res) {
  try {
    const visitorId = Number(req.params.id);
    if (!visitorId) {
      return res.status(400).json({ success: false, message: "Valid visitor id is required" });
    }

    const updated = await visitorModel.markVisitorCheckOut(visitorId);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Visitor not found or cannot be checked out" });
    }

    const visitor = await visitorModel.getVisitorById(visitorId);
    emitSafe("visitor:checked_out", visitor);
    return res.json({ success: true, message: "Visitor checked out", data: visitor });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function approveOwnerPreapproval(req, res) {
  try {
    if (req.user.role !== "resident" || req.user.residentType !== "owner") {
      return res.status(403).json({ success: false, message: "Only owners can approve visitor requests" });
    }

    const preapprovalId = Number(req.params.id);
    const updated = await visitorModel.updateVisitorPreapprovalStatus({
      id: preapprovalId,
      ownerId: req.user.id,
      status: "approved",
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Visitor pre-approval not found" });
    }

    const preapproval = await visitorModel.getVisitorPreapprovalById(preapprovalId);
    emitSafe("visitor:preapproval_approved", preapproval);

    return res.json({ success: true, message: "Pre-approval approved", data: preapproval });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function rejectOwnerPreapproval(req, res) {
  try {
    if (req.user.role !== "resident" || req.user.residentType !== "owner") {
      return res.status(403).json({ success: false, message: "Only owners can reject visitor requests" });
    }

    const preapprovalId = Number(req.params.id);
    const updated = await visitorModel.updateVisitorPreapprovalStatus({
      id: preapprovalId,
      ownerId: req.user.id,
      status: "cancelled",
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Visitor pre-approval not found" });
    }

    return res.json({ success: true, message: "Pre-approval rejected" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function issueQrPass(req, res) {
  try {
    const preapprovalId = Number(req.params.id);
    const issued = await visitorModel.issueQrPass({
      preapprovalId,
      issuedBy: req.user.id,
      deviceLabel: req.body.deviceLabel,
    });

    const preapproval = await visitorModel.getVisitorPreapprovalById(preapprovalId);
    emitSafe("visitor:qr_pass_issued", { preapprovalId, issued });

    return res.status(201).json({ success: true, message: "QR pass issued", data: { ...issued, preapproval } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to issue QR pass" });
  }
}

async function sendOtp(req, res) {
  try {
    const preapprovalId = Number(req.params.id);
    const otp = await visitorModel.createVisitorOtp({ preapprovalId, issuedBy: req.user.id });
    emitSafe("visitor:otp_issued", { preapprovalId, expiresAt: otp.expiresAt });

    return res.status(201).json({
      success: true,
      message: "OTP generated",
      data: {
        otpId: otp.id,
        otpCode: process.env.NODE_ENV === "production" ? undefined : otp.otpCode,
        expiresAt: otp.expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate OTP" });
  }
}

async function verifyOtp(req, res) {
  try {
    const preapprovalId = Number(req.params.id);
    const otpCode = String(req.body.otpCode || "").trim();

    if (!otpCode) {
      return res.status(400).json({ success: false, message: "otpCode is required" });
    }

    const result = await visitorModel.verifyVisitorOtp({ preapprovalId, otpCode, verifiedBy: req.user.id });
    if (!result.verified) {
      return res.status(400).json({ success: false, message: result.reason || "OTP verification failed" });
    }

    // If OTP verified, mark preapproval as approved and emit event
    const preapproval = await visitorModel.getVisitorPreapprovalById(preapprovalId);
    emitSafe("visitor:otp_verified", { preapprovalId, otpId: result.otpId });
    if (preapproval) {
      emitSafe("visitor:preapproval_approved", preapproval);
    }

    return res.json({ success: true, message: "OTP verified", data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
}

async function recognizeFace(req, res) {
  try {
    const { photoBase64, visitorName, phone, flatId, faceSignature } = req.body;
    if (!photoBase64) {
      return res.status(400).json({ success: false, message: "Please capture visitor face before check-in." });
    }

    const computedSignature = visitorModel.createSignature(faceSignature || photoBase64);
    const faceCaptureUrl = await uploadVisitorPhoto(photoBase64);
    const recognition = await visitorModel.recognizeVisitorFace({
      faceCaptureUrl,
      faceSignature: computedSignature,
      phone,
      visitorName,
      flatId,
    });

    if (recognition.matchFound && recognition.match) {
      await visitorModel.upsertVisitorFaceProfile({
        preapprovalId: recognition.match.id,
        visitorName: recognition.match.visitor_name,
        phone: recognition.match.phone,
        flatId: recognition.match.flat_id,
        faceCaptureUrl,
        faceSignature: computedSignature,
        faceMatchConfidence: recognition.confidence,
        createdBy: req.user.id,
      });
    }

    emitSafe("visitor:face_recognized", recognition);

    return res.json({ success: true, data: recognition });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to recognize face" });
  }
}

async function addBlacklist(req, res) {
  try {
    const { visitorName, phone, reason, flatId, faceSignature } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: "reason is required" });
    }

    const id = await visitorModel.addBlacklistEntry({
      visitorName,
      phone,
      reason,
      flatId: flatId ? Number(flatId) : null,
      faceSignature: faceSignature ? visitorModel.createSignature(faceSignature) : null,
      blockedBy: req.user.id,
    });

    emitSafe("visitor:blacklist_added", { id, visitorName, phone, reason });
    return res.status(201).json({ success: true, message: "Blacklist entry added", data: { id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to add blacklist entry" });
  }
}

async function getVisitorLogs(req, res) {
  try {
    const logs = await visitorModel.getVisitorLogs({
      societyId: req.user?.societyId || req.user?.society_id || null,
      wing: req.query.wing,
      search: req.query.search,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      status: req.query.status,
    });

    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getVisitorHistory(req, res) {
  return getVisitorLogs(req, res);
}

async function createVehicleEntry(req, res) {
  try {
    const { visitorId, preapprovalId, vehicleNumber, vehicleType, ownerName, flatId, entryMethod } = req.body;
    if (!vehicleNumber) {
      return res.status(400).json({ success: false, message: "vehicleNumber is required" });
    }

    const id = await visitorModel.createVehicleEntry({
      visitorId: visitorId ? Number(visitorId) : null,
      preapprovalId: preapprovalId ? Number(preapprovalId) : null,
      vehicleNumber,
      vehicleType,
      ownerName,
      flatId: flatId ? Number(flatId) : null,
      entryMethod,
      createdBy: req.user.id,
    });

    emitSafe("visitor:vehicle_entry", { id, vehicleNumber, ownerName, flatId });
    return res.status(201).json({ success: true, message: "Vehicle entry created", data: { id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create vehicle entry" });
  }
}

async function listVehicleEntries(req, res) {
  try {
    const rows = await visitorModel.listVehicleEntries({ search: req.query.search });
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch vehicle entries" });
  }
}

async function createDeliveryEntry(req, res) {
  try {
    const { visitorId, deliveryType, packageId, recipientName, deliveryPartner, flatId, status, notes } = req.body;
    if (!deliveryType) {
      return res.status(400).json({ success: false, message: "deliveryType is required" });
    }

    const id = await visitorModel.createDeliveryEntry({
      visitorId: visitorId ? Number(visitorId) : null,
      deliveryType,
      packageId,
      recipientName,
      deliveryPartner,
      flatId: flatId ? Number(flatId) : null,
      status,
      notes,
      createdBy: req.user.id,
    });

    emitSafe("visitor:delivery_entry", { id, deliveryType, packageId, flatId });
    return res.status(201).json({ success: true, message: "Delivery entry created", data: { id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create delivery entry" });
  }
}

async function listDeliveryEntries(req, res) {
  try {
    const rows = await visitorModel.listDeliveryEntries({ status: req.query.status, search: req.query.search });
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch delivery entries" });
  }
}

async function getVisitorAnalytics(req, res) {
  try {
    const data = await visitorModel.createVisitorAnalyticsSnapshot();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
}

async function getVisitorDashboard(req, res) {
  try {
    const data = await visitorModel.getVisitorDashboard({
      wing: req.query.wing,
      societyId: req.user?.societyId || req.user?.society_id || null,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch visitor dashboard" });
  }
}

async function createEmergencyAlert(req, res) {
  try {
    const { alertType, severity, message, location } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const id = await visitorModel.createEmergencyAlert({
      triggeredBy: req.user.id,
      alertType,
      severity,
      message,
      location,
    });

    await notificationModel.createNotification({
      targetRole: "all",
      title: "Emergency alert",
      message,
      priority: severity || "high",
      category: "emergency_alert",
      relatedType: "emergency_alert",
      relatedId: id,
      deepLink: `/security?alert=${id}`,
    });

    emitSafe("visitor:emergency_alert", { id, alertType, severity, message, location });
    return res.status(201).json({ success: true, message: "Emergency alert created", data: { id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create emergency alert" });
  }
}

async function listEmergencyAlerts(req, res) {
  try {
    const rows = await visitorModel.listEmergencyAlerts({ status: req.query.status });
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch emergency alerts" });
  }
}

async function acknowledgeEmergencyAlert(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Valid id is required" });
    }

    const updated = await visitorModel.acknowledgeEmergencyAlert({ id, userId: req.user.id });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Active alert not found" });
    }

    emitSafe("visitor:emergency_alert_acknowledged", { id, userId: req.user.id });
    return res.json({ success: true, message: "Alert acknowledged" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to acknowledge alert" });
  }
}

async function resolveEmergencyAlert(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Valid id is required" });
    }

    const updated = await visitorModel.resolveEmergencyAlert({ id, userId: req.user.id });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    emitSafe("visitor:emergency_alert_resolved", { id, userId: req.user.id });
    return res.json({ success: true, message: "Alert resolved" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to resolve alert" });
  }
}

async function updateVisitorExit(req, res) {
  try {
    const visitorId = Number(req.params.id);
    if (!visitorId) {
      return res.status(400).json({ success: false, message: "Valid visitor id is required" });
    }

    const visitor = await visitorModel.getVisitorById(visitorId);
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor entry not found" });
    }

    // Allow security to mark check-out
    const updated = await visitorModel.markVisitorCheckOut(visitorId);
    if (!updated) {
      return res.status(400).json({ success: false, message: "Visitor is not in a state that can be checked out" });
    }

    const updatedVisitor = await visitorModel.getVisitorById(visitorId);
    emitSafe("visitor:checked_out", updatedVisitor);

    return res.json({ success: true, message: "Visitor checked out", data: updatedVisitor });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  addVisitorEntry,
  createOwnerPreapproval,
  getOwnerPreapprovals,
  listSecurityPreapprovals,
  updatePreapprovalStatusBySecurity,
  verifyQrToken,
  checkInFromPreapproval,
  checkOutVisitorBySecurity,
  securityUpdatePreapprovalStatus,
  securityCheckInPreapproval,
  securityCheckOutVisitor,
  approveOwnerPreapproval,
  rejectOwnerPreapproval,
  issueQrPass,
  sendOtp,
  verifyOtp,
  recognizeFace,
  addBlacklist,
  updateVisitorExit,
  getVisitorLogs,
  getVisitorHistory,
  createVehicleEntry,
  listVehicleEntries,
  createDeliveryEntry,
  listDeliveryEntries,
  getVisitorAnalytics,
  getVisitorDashboard,
  createEmergencyAlert,
  listEmergencyAlerts,
  acknowledgeEmergencyAlert,
  resolveEmergencyAlert,
};
