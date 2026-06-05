const express = require("express");
const db = require("../config/db");
const societyModel = require("../models/societyModel");
const wingModel = require("../models/wingModel");
const flatModel = require("../models/flatModel");

const router = express.Router();

router.get("/society", async (req, res) => {
  try {
    const { code, societyId } = req.query;
    let society = null;

    if (code) {
      society = await societyModel.getSocietyByCode(String(code).trim());
    } else if (societyId) {
      society = await societyModel.getSocietyById(Number(societyId));
    }

    if (!society) {
      return res.status(404).json({ success: false, message: "Society not found" });
    }

    return res.json({ success: true, data: society });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/societies", async (req, res) => {
  try {
    console.log("[Public] GET /societies");
    const { rows } = await db.query(
      `SELECT
         id,
         code AS society_code,
         COALESCE(society_name, name) AS society_name,
         subscription_plan AS plan,
         subscription_plan,
         status,
         city,
         state,
         b.logo_url,
         b.favicon_url,
         b.primary_color,
         b.secondary_color,
         b.accent_color,
         b.font_family,
         b.theme_json,
         created_at
       FROM societies s
       LEFT JOIN society_brandings b ON b.society_id = s.id
       WHERE s.status = 'active'
       ORDER BY s.created_at DESC`
    );

    console.log("[Public] GET /societies result", { count: rows.length });

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("[Public] Failed to load societies", error.code || error.message, error.sqlMessage || "");
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/societies/:societyId/landing-stats", async (req, res) => {
  try {
    const societyId = Number(req.params.societyId);
    if (!societyId) {
      return res.status(400).json({ success: false, message: "Invalid society id" });
    }

    const society = await societyModel.getSocietyById(societyId);
    if (!society) {
      return res.status(404).json({ success: false, message: "Society not found" });
    }

    const { rows: residentRows } = await db.query(
      `SELECT COUNT(*) AS total_residents FROM users WHERE role = 'resident' AND society_id = ?`,
      [societyId]
    );

    const { rows: paymentRows } = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_amount
       FROM bills
       WHERE society_id = ? AND status = 'paid'`,
      [societyId]
    );

    const { rows: openComplaintsRows } = await db.query(
      `SELECT COUNT(*) AS pending_complaints
       FROM complaints c
       JOIN users resident ON resident.id = c.resident_id
       WHERE resident.society_id = ? AND c.status = 'pending'`,
      [societyId]
    );

    const { rows: complaintSummaryRows } = await db.query(
      `SELECT COUNT(*) AS total_complaints,
              SUM(CASE WHEN c.status = 'resolved' THEN 1 ELSE 0 END) AS resolved_complaints
       FROM complaints c
       JOIN users resident ON resident.id = c.resident_id
       WHERE resident.society_id = ?`,
      [societyId]
    );

    const { rows: latestComplaintRows } = await db.query(
      `SELECT c.title, c.description, resident.name AS resident_name
       FROM complaints c
       JOIN users resident ON resident.id = c.resident_id
       WHERE resident.society_id = ? AND c.status = 'pending'
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [societyId]
    );

    const { rows: visitorRows } = await db.query(
      `SELECT COUNT(*) AS total_visitors
       FROM visitors v
       LEFT JOIN flats f ON f.id = v.flat_id
       WHERE f.society_id = ? AND DATE(v.check_in_time) = CURRENT_DATE`,
      [societyId]
    );

    const activeResidents = Number(residentRows[0]?.total_residents || 0);
    const paymentsCollected = Number(paymentRows[0]?.total_amount || 0);
    const openComplaints = Number(openComplaintsRows[0]?.pending_complaints || 0);
    const totalComplaints = Number(complaintSummaryRows[0]?.total_complaints || 0);
    const resolvedComplaints = Number(complaintSummaryRows[0]?.resolved_complaints || 0);
    const latestComplaint = latestComplaintRows[0] || null;
    const todayVisitors = Number(visitorRows[0]?.total_visitors || 0);

    const aiTasksClosed = totalComplaints
      ? Math.round((resolvedComplaints / totalComplaints) * 100)
      : 0;

    const societyHealth = activeResidents
      ? `${Math.max(45, Math.min(100, 96 - Math.round((openComplaints / Math.max(activeResidents, 1)) * 100)))}%`
      : "N/A";

    const complaintPreview = latestComplaint
      ? `Latest issue: ${latestComplaint.title}`
      : "No active complaints right now.";

    const residentMessage = latestComplaint
      ? `${latestComplaint.resident_name}: ${String(latestComplaint.description).slice(0, 120)}`
      : "No urgent resident issues currently.";

    const maintenanceStatus = openComplaints
      ? `${openComplaints} pending maintenance task${openComplaints === 1 ? "" : "s"}`
      : "Maintenance operations are stable.";

    return res.json({
      success: true,
      data: {
        society: {
          id: society.id,
          name: society.name,
          code: society.code,
          city: society.city,
          state: society.state,
          status: society.status,
          subscription_plan: society.subscription_plan,
        },
        stats: {
          activeResidents,
          paymentsCollected,
          openComplaints,
          todayVisitors,
          aiTasksClosed,
          societyHealth,
          complaintPreview,
          residentMessage,
          maintenanceStatus,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/societies/:societyId/live-preview", async (req, res) => {
  try {
    const societyId = Number(req.params.societyId);
    if (!societyId) {
      return res.status(400).json({ success: false, message: "Invalid society id" });
    }

    const society = await societyModel.getSocietyById(societyId);
    if (!society) {
      return res.status(404).json({ success: false, message: "Society not found" });
    }

    const { rows: residentRows } = await db.query(
      `SELECT COUNT(*) AS total_residents FROM users WHERE role = 'resident' AND society_id = ?`,
      [societyId]
    );

    const { rows: flatRows } = await db.query(
      `SELECT
         COUNT(*) AS total_flats,
         COALESCE(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END), 0) AS occupied_flats
       FROM flats
       WHERE society_id = ?`,
      [societyId]
    );

    const { rows: complaintRows } = await db.query(
      `SELECT COUNT(*) AS pending_complaints
       FROM complaints c
       JOIN users resident ON resident.id = c.resident_id
       WHERE resident.society_id = ? AND c.status = 'pending'`,
      [societyId]
    );

    const { rows: visitorRows } = await db.query(
      `SELECT COUNT(*) AS today_visitors
       FROM visitors v
       JOIN flats f ON f.id = v.flat_id
       WHERE f.society_id = ? AND DATE(v.entry_time) = CURRENT_DATE`,
      [societyId]
    );

    const { rows: paymentRows } = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_collections
       FROM bills
       WHERE society_id = ? AND status = 'paid'`,
      [societyId]
    );

      let aiTaskCount = 0;
      try {
        const { rows: aiRows } = await db.query(
          `SELECT COUNT(*) AS ai_task_count FROM ai_chats WHERE society_id = ?`,
          [societyId]
        );
        aiTaskCount = Number(aiRows[0]?.ai_task_count || 0);
      } catch (error) {
        if (error.code !== "ER_NO_SUCH_TABLE") {
          throw error;
        }
      }

    const { rows: noticeRows } = await db.query(
      `SELECT n.id, n.title, n.message, n.created_at, u.name AS created_by
       FROM notices n
       JOIN users u ON u.id = n.created_by
       WHERE u.society_id = ?
       ORDER BY n.created_at DESC
       LIMIT 3`,
      [societyId]
    );

    const { rows: maintenanceRows } = await db.query(
      `SELECT c.id, c.title, c.description, c.status, c.created_at, resident.name AS resident_name
       FROM complaints c
       JOIN users resident ON resident.id = c.resident_id
       WHERE resident.society_id = ? AND c.status = 'pending'
       ORDER BY c.created_at DESC
       LIMIT 3`,
      [societyId]
    );

    return res.json({
      success: true,
      data: {
        society: {
          id: society.id,
          name: society.name,
          code: society.code,
          city: society.city,
          state: society.state,
          status: society.status,
          subscription_plan: society.subscription_plan,
        },
        livePreview: {
          totalResidents: Number(residentRows[0]?.total_residents || 0),
          totalFlats: Number(flatRows[0]?.total_flats || 0),
          occupiedFlats: Number(flatRows[0]?.occupied_flats || 0),
          pendingComplaints: Number(complaintRows[0]?.pending_complaints || 0),
          todayVisitors: Number(visitorRows[0]?.today_visitors || 0),
          totalCollections: Number(paymentRows[0]?.total_collections || 0),
             aiTaskCount,
          notices: noticeRows || [],
          maintenanceAlerts: maintenanceRows || [],
        },
      },
    });
  } catch (error) {
      console.error("[Public] Failed to load live preview", error.code || error.message, error.sqlMessage || "");
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/flats", async (req, res) => {
  try {
    const { societyCode, societyId, wing, availableOnly = "true" } = req.query;
    let targetSocietyId = societyId ? Number(societyId) : null;

    if (!targetSocietyId && societyCode) {
      const society = await societyModel.getSocietyByCode(String(societyCode).trim());
      if (society) {
        targetSocietyId = society.id;
      }
    }

    if (!targetSocietyId) {
      return res.status(400).json({ success: false, message: "societyCode or societyId is required" });
    }

    const flats = await flatModel.getFlatsWithOccupancy({
      societyId: targetSocietyId,
      wing: wing ? String(wing).trim().toUpperCase() : null,
    });

    const filteredFlats = availableOnly === "true" ? flats.filter((flat) => flat.status === "vacant") : flats;

    return res.json({ success: true, data: filteredFlats });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
