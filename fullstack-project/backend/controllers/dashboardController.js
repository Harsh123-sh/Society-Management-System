const db = require("../config/db");
const builderModel = require("../models/builderModel");
const societyModel = require("../models/societyModel");
const userModel = require("../models/userModel");
const analyticsModel = require("../models/analyticsModel");

/**
 * Super Admin Dashboard - System-wide metrics
 */
async function getSuperAdminDashboard(req, res) {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }

    const builders = await builderModel.listBuilders(1000);
    const totalBuilders = builders.length;
    const activeBuilders = builders.filter((b) => b.status === "active").length;

    const societyCounts = await Promise.all(
      builders.map((builder) => builderModel.getSocietyCountForBuilder(builder.id))
    );
    const totalSocieties = societyCounts.reduce((sum, count) => sum + count, 0);

    const userCounts = await Promise.all(
      builders.map((builder) => builderModel.getUserCountForBuilder(builder.id))
    );
    const totalUsers = userCounts.reduce((sum, count) => sum + count, 0);

    return res.json({
      success: true,
      data: {
        metrics: {
          totalBuilders,
          activeBuilders,
          totalSocieties,
          totalUsers,
          totalRevenue: 0,
        },
        recentBuilders: builders.slice(0, 10),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
            [societyId]
 */
async function getBuilderDashboard(req, res) {
  try {
    if (!req.builder) {
      return res.status(403).json({ success: false, message: "Builder context required" });
    }

    const builder = await builderModel.getBuilderById(req.builder.id);
    if (!builder) {
      return res.status(404).json({ success: false, message: "Builder not found" });
    }

    const societyCount = await builderModel.getSocietyCountForBuilder(req.builder.id);
    const userCount = await builderModel.getUserCountForBuilder(req.builder.id);

    return res.json({
      success: true,
      data: {
        builder: {
          id: builder.id,
          name: builder.name,
          email: builder.email,
          status: builder.status,
          subscriptionPlan: builder.subscription_plan,
          createdAt: builder.created_at,
        },
        metrics: {
          totalSocieties: societyCount,
          maxSocieties: builder.max_societies,
          usedSocietiesPercentage: builder.max_societies
            ? Math.round((societyCount / builder.max_societies) * 100)
            : 0,
          totalUsers: userCount,
          maxUsers: builder.max_users,
          usedUsersPercentage: builder.max_users
            ? Math.round((userCount / builder.max_users) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Society Admin Dashboard
 */
async function getSocietyDashboard(req, res) {
  try {
    if (!req.society) {
      return res.status(403).json({ success: false, message: "Society context required" });
    }

    const society = await societyModel.getSocietyById(req.society.id);
    const { rows: userRows } = await db.query(
      `SELECT id, name, email, role, resident_type, status
       FROM users
       WHERE id = ? AND society_id = ?
       LIMIT 1`,
      [req.user.id, req.society.id]
    );

    const { rows: leadershipRows } = await db.query(
      `SELECT id, name, email, role, status
       FROM users
       WHERE society_id = ? AND role IN ('admin', 'secretary')
       ORDER BY CASE WHEN role = 'admin' THEN 1 WHEN role = 'secretary' THEN 2 ELSE 3 END, id ASC`,
      [req.society.id]
    );

    const currentUser = userRows[0] || null;
    const roleLabel = currentUser?.role === "admin" ? "Chairman" : currentUser?.role === "secretary" ? "Secretary" : currentUser?.role || "User";
    const chairman = leadershipRows.find((item) => item.role === "admin") || null;
    const secretary = leadershipRows.find((item) => item.role === "secretary") || null;

    // Get user statistics
    const { rows: userStats } = await db.query(
      `SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'resident' AND resident_type = 'owner' THEN 1 ELSE 0 END) as total_owners,
        SUM(CASE WHEN role = 'resident' AND resident_type = 'tenant' THEN 1 ELSE 0 END) as total_tenants,
        SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) as total_staff,
        SUM(CASE WHEN role = 'security' THEN 1 ELSE 0 END) as total_security
       FROM users
       WHERE society_id = ? AND builder_id = ?`,
      [req.society.id, req.society.builderId]
    );

    return res.json({
      success: true,
      data: {
        user: currentUser
          ? {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              role: currentUser.role,
              roleLabel,
              residentType: currentUser.resident_type || null,
              status: currentUser.status || null,
            }
          : null,
        society: {
          id: society.id,
          name: society.name,
          code: society.code,
          slug: society.slug || null,
          subdomain: society.subdomain || null,
          logoUrl: society.logo_url || null,
          status: society.status,
          subscriptionTier: society.subscription_tier,
          address: society.address || null,
          city: society.city || null,
          state: society.state || null,
          pincode: society.pincode || null,
          contactEmail: society.contact_email || null,
          contactPhone: society.contact_phone || null,
          configuredAt: society.configured_at,
        },
        chairmanName: chairman?.name || null,
        secretaryName: secretary?.name || null,
        metrics: userStats[0] || {
          total_users: 0,
          total_owners: 0,
          total_tenants: 0,
          total_staff: 0,
          total_security: 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Owner Dashboard
 */
async function getOwnerDashboard(req, res) {
  try {
    if (req.user?.role !== "resident" || req.user?.resident_type !== "owner") {
      return res.status(403).json({ success: false, message: "Owner access required" });
    }

    const userId = req.user.id;
    const societyId = req.user.societyId;

    if (!societyId) {
      return res.status(403).json({ success: false, message: "Society context required" });
    }

    // Get user and society information
    const { rows: userInfo } = await db.query(
      `SELECT u.id, u.name, u.email, u.flat_id, s.id as society_id, s.name as society_name, s.code as society_code
       FROM users u
       LEFT JOIN societies s ON s.id = u.society_id
       WHERE u.id = ? AND u.society_id = ? AND u.resident_type = 'owner'`,
      [userId, societyId]
    );

    if (!userInfo || userInfo.length === 0) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    const user = userInfo[0];

    // Get owner's flat details
    let flatDetails = null;
    if (user.flat_id) {
      const { rows: flatData } = await db.query(
        `SELECT f.id, f.flat_number, f.building_name, f.wing, f.floor, f.status, f.flat_type,
                COUNT(DISTINCT fr.resident_id) as tenant_count
         FROM flats f
         LEFT JOIN flat_residents fr ON fr.flat_id = f.id AND fr.is_active = TRUE
         WHERE f.id = ? AND f.society_id = ?
         GROUP BY f.id`,
        [user.flat_id, societyId]
      );
      flatDetails = flatData[0] || null;
    }

    // Get tenants in owner's flat
    let tenants = [];
    if (user.flat_id) {
      const { rows: tenantData } = await db.query(
        `SELECT u.id, u.name, u.email, u.resident_type, u.status as user_status,
                fr.move_in_date, fr.is_active as is_active_tenant
         FROM flat_residents fr
         JOIN users u ON u.id = fr.resident_id
         WHERE fr.flat_id = ? AND u.society_id = ? AND fr.is_active = TRUE`,
        [user.flat_id, societyId]
      );
      tenants = tenantData || [];
    }

    // Get bills for owner's flat
    const { rows: billsData } = await db.query(
      `SELECT id, amount, status, bill_date, due_date, bill_type
       FROM bills
       WHERE flat_id = ? AND society_id = ? 
       ORDER BY bill_date DESC
       LIMIT 10`,
      [user.flat_id, societyId]
    );

    // Get complaints for owner's flat
    const { rows: complaintsData } = await db.query(
      `SELECT c.id, c.title, c.status, c.created_at
       FROM complaints c
       WHERE c.resident_id = ? AND c.status = 'pending'
       LIMIT 5`,
      [userId]
    );

    // Get documents for owner's flat
    const { rows: documentsData } = await db.query(
      `SELECT id, document_type, title, uploaded_at
       FROM documents
       WHERE (flat_id = ? OR society_id = ?) AND society_id = ?
       LIMIT 10`,
      [user.flat_id, societyId, societyId]
    );

    // Calculate dashboard metrics
    const billStats = (billsData || []).reduce(
      (acc, bill) => {
        if (bill.status === "pending") acc.pending_count++;
        if (bill.status === "paid") acc.paid_count++;
        acc.total_amount += Number(bill.amount || 0);
        return acc;
      },
      { pending_count: 0, paid_count: 0, total_amount: 0 }
    );

    return res.json({
      success: true,
      data: {
        society: {
          id: user.society_id,
          name: user.society_name,
          code: user.society_code,
        },
        owner: {
          id: user.id,
          name: user.name,
          email: user.email,
          flat_assigned: !!flatDetails,
          flat_id: user.flat_id,
        },
        flat: flatDetails ? {
          id: flatDetails.id,
          number: flatDetails.flat_number,
          building: flatDetails.building_name,
          wing: flatDetails.wing,
          floor: flatDetails.floor,
          type: flatDetails.flat_type,
          status: flatDetails.status,
          tenants_count: flatDetails.tenant_count || 0,
        } : null,
        statistics: {
          tenants: tenants.length,
          pending_bills: billStats.pending_count,
          paid_bills: billStats.paid_count,
          total_bill_amount: billStats.total_amount,
          pending_complaints: complaintsData?.length || 0,
          documents: documentsData?.length || 0,
        },
        tenants: tenants || [],
        recent_bills: billsData || [],
        pending_complaints: complaintsData || [],
        documents: documentsData || [],
      },
    });
  } catch (error) {
    console.error("Owner dashboard error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Tenant Dashboard
 */
async function getTenantDashboard(req, res) {
  try {
    if (req.user?.role !== "resident" || req.user?.resident_type !== "tenant") {
      return res.status(403).json({ success: false, message: "Tenant access required" });
    }

    const userId = req.user.id;
      const societyId = req.user.societyId;

      if (!societyId) {
        return res.status(403).json({ success: false, message: "Society context required" });
      }

      // Get user and society information
      const { rows: userInfo } = await db.query(
        `SELECT u.id, u.name, u.email, u.flat_id, s.id as society_id, s.name as society_name, s.code as society_code
         FROM users u
         LEFT JOIN societies s ON s.id = u.society_id
         WHERE u.id = ? AND u.society_id = ? AND u.resident_type = 'tenant'`,
        [userId, societyId]
      );

      if (!userInfo || userInfo.length === 0) {
        return res.status(404).json({ success: false, message: "Tenant not found" });
      }

      const user = userInfo[0];

      // Get tenant's flat details with owner info
      let flatDetails = null;
      let ownerInfo = null;
      if (user.flat_id) {
        const { rows: flatData } = await db.query(
          `SELECT f.id, f.flat_number, f.building_name, f.wing, f.floor, f.status, f.flat_type
           FROM flats f
           WHERE f.id = ? AND f.society_id = ?`,
          [user.flat_id, societyId]
        );
        flatDetails = flatData[0] || null;

        // Get owner of this flat
        const { rows: ownerData } = await db.query(
          `SELECT u.id, u.name, u.email, u.phone
           FROM users u
           WHERE u.flat_id = ? AND u.society_id = ? AND u.resident_type = 'owner'`,
           [user.flat_id, societyId]
        );
        ownerInfo = ownerData[0] || null;
      }

      // Get bills for tenant's flat
      const { rows: billsData } = await db.query(
        `SELECT id, amount, status, bill_date, due_date, bill_type
         FROM bills
         WHERE flat_id = ? AND society_id = ?
         ORDER BY bill_date DESC
         LIMIT 10`,
        [user.flat_id, societyId]
      );

      // Get complaints filed by tenant
      const { rows: complaintsData } = await db.query(
        `SELECT id, title, status, created_at
         FROM complaints
         WHERE resident_id = ?
         LIMIT 5`,
        [userId]
      );

      // Get documents for tenant
      const { rows: documentsData } = await db.query(
        `SELECT id, document_type, title, uploaded_at
         FROM documents
         WHERE (flat_id = ? OR society_id = ?) AND society_id = ?
         LIMIT 10`,
        [user.flat_id, societyId, societyId]
      );

      // Calculate metrics
      const billStats = (billsData || []).reduce(
        (acc, bill) => {
          if (bill.status === "pending") acc.pending_count++;
          if (bill.status === "paid") acc.paid_count++;
          acc.total_amount += Number(bill.amount || 0);
          return acc;
        },
        { pending_count: 0, paid_count: 0, total_amount: 0 }
      );

    return res.json({
      success: true,
      data: {
          society: {
            id: user.society_id,
            name: user.society_name,
            code: user.society_code,
          },
          tenant: {
            id: user.id,
            name: user.name,
            email: user.email,
            flat_id: user.flat_id,
          },
          flat: flatDetails ? {
            id: flatDetails.id,
            number: flatDetails.flat_number,
            building: flatDetails.building_name,
            wing: flatDetails.wing,
            floor: flatDetails.floor,
            type: flatDetails.flat_type,
            status: flatDetails.status,
          } : null,
          owner: ownerInfo,
          statistics: {
            pending_bills: billStats.pending_count,
            paid_bills: billStats.paid_count,
            total_bill_amount: billStats.total_amount,
            complaints_filed: complaintsData?.length || 0,
            documents: documentsData?.length || 0,
          },
          recent_bills: billsData || [],
          complaints: complaintsData || [],
          documents: documentsData || [],
        },
      });
    } catch (error) {
      console.error("Tenant dashboard error:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

/**
 * Security/Guard Dashboard
 */
async function getSecurityDashboard(req, res) {
  try {
    if (req.user?.role !== "security") {
      return res.status(403).json({ success: false, message: "Security access required" });
    }

    // Get recent visitor entries
    const { rows: recentVisitors } = await db.query(
      `SELECT v.id, v.name, v.visit_date, v.visit_time, v.purpose, v.status, f.flat_number, f.wing
       FROM visitors v
       LEFT JOIN flats f ON f.id = v.flat_id
       WHERE v.society_id = ?
       ORDER BY v.visit_date DESC, v.visit_time DESC
       LIMIT 20`,
      [req.user.society_id]
    );

    // Get emergency alerts
    const { rows: alerts } = await db.query(
      `SELECT id, alert_type, severity, message, location, triggered_at, status
       FROM security_alerts
       WHERE society_id = ? AND triggered_at > NOW() - INTERVAL '7 days'
       ORDER BY triggered_at DESC
       LIMIT 10`,
      [req.user.society_id]
    );

    return res.json({
      success: true,
      data: {
        user: {
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
        recentVisitors: recentVisitors || [],
        emergencyAlerts: alerts || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  getSuperAdminDashboard,
  getBuilderDashboard,
  getSocietyDashboard,
  getOwnerDashboard,
  getTenantDashboard,
  getSecurityDashboard,
};
