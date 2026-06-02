const analyticsModel = require("../models/analyticsModel");
const ownerDashboardModel = require("../models/ownerDashboardModel");

async function getOverviewStats(req, res) {
  try {
    const [
      totalResidents,
      pendingComplaints,
      totalUnpaidBills,
      complaintStatus,
      billStatus,
      monthlyTrend,
    ] = await Promise.all([
      analyticsModel.getTotalResidents(),
      analyticsModel.getPendingComplaints(),
      analyticsModel.getUnpaidBills(),
      analyticsModel.getComplaintStatusBreakdown(),
      analyticsModel.getBillStatusBreakdown(),
      analyticsModel.getMonthlyComplaintsAndBills(6),
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          totalResidents,
          pendingComplaints,
          totalUnpaidBills,
        },
        charts: {
          complaintStatus,
          billStatus,
          monthlyTrend,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getOwnerDashboard(req, res) {
  try {
    if (req.user.role !== "resident" || req.user.residentType !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Owner dashboard is only available to owner accounts",
      });
    }

    const ownerId = req.user.id;

    const [ownerProfile, propertyRows, bills, complaints, preapprovals, visitorHistory, timeline, documents, parkingSlots] =
      await Promise.all([
        ownerDashboardModel.getOwnerProfile(ownerId),
        ownerDashboardModel.getOwnerPropertyRows(ownerId),
        ownerDashboardModel.getOwnerBills(ownerId),
        ownerDashboardModel.getOwnerComplaints(ownerId),
        ownerDashboardModel.getOwnerPreapprovals(ownerId),
        ownerDashboardModel.getOwnerVisitorHistory(ownerId),
        ownerDashboardModel.getOwnerActivityTimeline(ownerId, 30),
        ownerDashboardModel.getOwnerDocuments(ownerId),
        ownerDashboardModel.getOwnerParkingSlots(ownerId),
      ]);

    const propertyMap = new Map();
    for (const row of propertyRows) {
      if (!propertyMap.has(row.flat_id)) {
        propertyMap.set(row.flat_id, {
          ownerPropertyId: row.owner_property_id,
          flatId: row.flat_id,
          societyId: row.society_id,
          societyName: row.society_name,
          societyCode: row.society_code,
          buildingName: row.building_name,
          wing: row.wing,
          flatNumber: row.flat_number,
          floor: row.floor,
          type: row.flat_type,
          occupancyStatus: row.flat_status,
          approvalStatus: row.approval_status,
          livingStartDate: row.living_start_date,
          owner: {
            id: row.owner_id,
            name: row.owner_name,
            email: row.owner_email,
            phone: row.owner_phone,
          },
          tenants: [],
        });
      }

      if (row.tenant_id) {
        propertyMap.get(row.flat_id).tenants.push({
          id: row.tenant_id,
          name: row.tenant_name,
          email: row.tenant_email,
          phone: row.tenant_phone,
          status: row.tenant_status,
          isVerified: Boolean(row.tenant_is_verified),
          residentType: row.tenant_resident_type,
          isActive: Boolean(row.tenant_is_active),
          moveInDate: row.tenant_move_in_date,
        });
      }
    }

    const properties = Array.from(propertyMap.values());
    const primaryProperty = properties[0] || null;
    const parsedFamilyMembers = (() => {
      if (!ownerProfile?.family_members) return [];

      if (Array.isArray(ownerProfile.family_members)) return ownerProfile.family_members;

      if (typeof ownerProfile.family_members === "string") {
        try {
          const value = JSON.parse(ownerProfile.family_members);
          return Array.isArray(value) ? value : [];
        } catch {
          return [];
        }
      }

      return [];
    })();

    const normalizedDocuments = documents.map((document) => ({
      ...document,
      status: document.status || "pending",
    }));

    const ownerParking = parkingSlots.map((slot) => ({
      id: slot.id,
      slotNumber: slot.slot_number,
      wing: slot.wing,
      floor: slot.floor,
      type: slot.type,
      status: slot.status,
      block: slot.block,
      flatId: slot.flat_id,
      flatNumber: slot.flat_number,
      buildingName: slot.building_name,
      ownerName: slot.owner_name,
      ownerEmail: slot.owner_email,
    }));

    const ownerDetails = ownerProfile || primaryProperty
      ? {
          userId: primaryProperty?.owner?.id || ownerProfile?.id || ownerId,
          name: ownerProfile?.name || primaryProperty?.owner?.name || null,
          email: ownerProfile?.email || primaryProperty?.owner?.email || null,
          phone: ownerProfile?.phone || primaryProperty?.owner?.phone || null,
          profilePhotoUrl: ownerProfile?.profile_photo_url || null,
          societyName: ownerProfile?.society_name || primaryProperty?.societyName || null,
          societyCode: ownerProfile?.society_code || primaryProperty?.societyCode || null,
          flatNumber: primaryProperty?.flatNumber || ownerProfile?.flat_number || null,
          wing: primaryProperty?.wing || null,
          floor: primaryProperty?.floor || null,
          flatType: primaryProperty?.type || null,
          buildingName: primaryProperty?.buildingName || null,
          livingStartDate: primaryProperty?.livingStartDate || null,
          ownershipStatus: primaryProperty?.approvalStatus || (ownerProfile ? "approved" : null),
          occupancyStatus: primaryProperty?.occupancyStatus || (ownerProfile ? "occupied" : null),
          residentType: ownerProfile?.resident_type || "owner",
          accountStatus: ownerProfile?.status || "active",
          isVerified: Boolean(ownerProfile?.is_verified),
          familyMembers: parsedFamilyMembers,
          documents: normalizedDocuments,
          vehicles: ownerParking,
        }
      : null;
    const now = new Date();

    const billTotals = bills.reduce(
      (acc, bill) => {
        const amount = Number(bill.total_amount || 0);
        acc.total += amount;

        if (bill.status === "paid") {
          acc.paid += amount;
        } else {
          acc.unpaid += amount;
          if (bill.due_date && new Date(bill.due_date) < now) {
            acc.overdue += amount;
          }
        }

        return acc;
      },
      { total: 0, paid: 0, unpaid: 0, overdue: 0 }
    );

    const stats = {
      properties: properties.length,
      activeTenants: properties.reduce((sum, item) => sum + item.tenants.length, 0),
      unpaidBills: bills.filter((bill) => bill.status === "unpaid").length,
      overdueBills: bills.filter((bill) => bill.due_status === "overdue").length,
      openComplaints: complaints.filter((complaint) => complaint.status === "pending").length,
      upcomingPreapprovals: preapprovals.filter((item) => item.status === "approved").length,
      documentsPending: normalizedDocuments.filter((document) => document.status === "pending").length,
      documentsApproved: normalizedDocuments.filter((document) => document.status === "approved").length,
      parkingSlots: ownerParking.length,
      billTotals,
    };

    return res.json({
      success: true,
      data: {
        stats,
        ownerDetails,
        properties,
        documents: normalizedDocuments,
        parking: ownerParking,
        billing: bills,
        complaints,
        visitors: {
          preapprovals,
          history: visitorHistory,
        },
        timeline,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ============ DATE RANGE PARSING UTILITY ============
function getDateRange(req) {
  const { startDate, endDate, days = 30 } = req.query;
  
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate 
    ? new Date(startDate) 
    : new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

// ============ COMPREHENSIVE ANALYTICS ENDPOINTS ============

async function getVisitorAnalyticsDash(req, res) {
  try {
    const { startDate, endDate } = getDateRange(req);
    const data = await analyticsModel.getVisitorAnalytics(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Visitor Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch visitor analytics" });
  }
}

async function getFinancialAnalyticsDash(req, res) {
  try {
    const { startDate, endDate } = getDateRange(req);
    const data = await analyticsModel.getFinancialAnalytics(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Financial Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch financial analytics" });
  }
}

async function getComplaintAnalyticsDash(req, res) {
  try {
    const { startDate, endDate } = getDateRange(req);
    const data = await analyticsModel.getComplaintAnalytics(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Complaint Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch complaint analytics" });
  }
}

async function getChatAnalyticsDash(req, res) {
  try {
    const { startDate, endDate } = getDateRange(req);
    const data = await analyticsModel.getChatAnalytics(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Chat Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chat analytics" });
  }
}

async function getPaymentAnalyticsDash(req, res) {
  try {
    const { startDate, endDate } = getDateRange(req);
    const data = await analyticsModel.getPaymentAnalytics(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Payment Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payment analytics" });
  }
}

async function getAIAnalyticsDash(req, res) {
  try {
    const { startDate, endDate } = getDateRange(req);
    const data = await analyticsModel.getAIAnalytics(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error("AI Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch AI analytics" });
  }
}

async function getStaffPerformanceDash(req, res) {
  try {
    const { startDate, endDate } = getDateRange(req);
    const data = await analyticsModel.getStaffPerformance(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Staff Performance Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch staff performance analytics" });
  }
}

async function getSecurityAnalyticsDash(req, res) {
  try {
    const { startDate, endDate } = getDateRange(req);
    const data = await analyticsModel.getSecurityAnalytics(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Security Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch security analytics" });
  }
}

async function getAllAnalytics(req, res) {
  try {
    const { startDate, endDate } = getDateRange(req);
    const data = await analyticsModel.getFullAnalyticsData(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Full Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch analytics data" });
  }
}

// ============ EXPORT ENDPOINTS ============

function convertToCSV(data, headers) {
  const csv = [headers.join(',')];
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
      return val;
    });
    csv.push(values.join(','));
  }
  return csv.join('\n');
}

async function exportAnalytics(req, res) {
  try {
    const { format = 'json', type = 'all', startDate, endDate, days = 30 } = req.query;
    
    const start = startDate 
      ? startDate 
      : new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate 
      ? endDate 
      : new Date().toISOString().split('T')[0];

    let data;
    if (type === 'all') {
      data = await analyticsModel.getFullAnalyticsData(start, end);
    } else {
      const methodName = `get${type.charAt(0).toUpperCase() + type.slice(1)}Analytics`;
      if (analyticsModel[methodName]) {
        data = { [type]: await analyticsModel[methodName](start, end) };
      } else {
        return res.status(400).json({ success: false, message: "Invalid analytics type" });
      }
    }

    if (format === 'csv') {
      // Flatten data for CSV export
      let csvData = [];
      
      if (type === 'financial' || type === 'all') {
        const financialData = data.financial || data;
        if (financialData.billStatus) {
          csvData = csvData.concat(financialData.billStatus.map(item => ({
            type: 'Bill Status',
            name: item.name,
            count: item.count,
            amount: item.amount,
          })));
        }
      }

      if (type === 'complaint' || type === 'all') {
        const complaintData = data.complaint || data;
        if (complaintData.topCategories) {
          csvData = csvData.concat(complaintData.topCategories.map(item => ({
            type: 'Complaint Category',
            category: item.category,
            count: item.count,
          })));
        }
      }

      if (type === 'payment' || type === 'all') {
        const paymentData = data.payment || data;
        if (paymentData.paymentMethods) {
          csvData = csvData.concat(paymentData.paymentMethods.map(item => ({
            type: 'Payment Method',
            method: item.method,
            count: item.count,
            amount: item.amount,
          })));
        }
      }

      const headers = Object.keys(csvData[0] || {});
      const csv = convertToCSV(csvData, headers);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(data);
    }
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ success: false, message: "Failed to export analytics" });
  }
}

module.exports = {
  // Legacy
  getOverviewStats,
  getOwnerDashboard,
  // New Analytics Endpoints
  getVisitorAnalyticsDash,
  getFinancialAnalyticsDash,
  getComplaintAnalyticsDash,
  getChatAnalyticsDash,
  getPaymentAnalyticsDash,
  getAIAnalyticsDash,
  getStaffPerformanceDash,
  getSecurityAnalyticsDash,
  getAllAnalytics,
  // Export
  exportAnalytics,
};
