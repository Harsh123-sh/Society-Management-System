const db = require("../db");

// ============ LEGACY METHODS (retained for compatibility) ============
async function getTotalResidents() {
  const [rows] = await db.query(
     "SELECT COUNT(*) AS total_residents FROM users WHERE role = 'resident'"
  );
  return Number(rows[0]?.total_residents || 0);
}

async function getPendingComplaints() {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS pending_complaints FROM complaints WHERE status = 'pending'"
  );
  return Number(rows[0]?.pending_complaints || 0);
}

async function getUnpaidBills() {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS unpaid_bills FROM bills WHERE status = 'unpaid'"
  );
  return Number(rows[0]?.unpaid_bills || 0);
}

async function getComplaintStatusBreakdown() {
  const [rows] = await db.query(
    `SELECT status, COUNT(*) AS total
     FROM complaints
     GROUP BY status`
  );

  return rows.map((row) => ({
    name: row.status,
    value: Number(row.total),
  }));
}

async function getBillStatusBreakdown() {
  const [rows] = await db.query(
    `SELECT status, COUNT(*) AS total
     FROM bills
     GROUP BY status`
  );

  return rows.map((row) => ({
    name: row.status,
    value: Number(row.total),
  }));
}

async function getMonthlyComplaintsAndBills(lastMonths = 6) {
  const [complaintRows] = await db.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key, COUNT(*) AS total
     FROM complaints
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
     GROUP BY month_key
     ORDER BY month_key ASC`,
    [lastMonths]
  );

  const [billRows] = await db.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key, COUNT(*) AS total
     FROM bills
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
     GROUP BY month_key
     ORDER BY month_key ASC`,
    [lastMonths]
  );

  const complaintMap = new Map(
    complaintRows.map((row) => [row.month_key, Number(row.total)])
  );
  const billMap = new Map(billRows.map((row) => [row.month_key, Number(row.total)]));

  const now = new Date();
  const labels = [];
  for (let i = lastMonths - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleString("en-US", { month: "short" });
    labels.push({ key, label });
  }

  return labels.map(({ key, label }) => ({
    month: label,
    complaints: complaintMap.get(key) || 0,
    bills: billMap.get(key) || 0,
  }));
}

// ============ VISITOR ANALYTICS ============
async function getVisitorAnalytics(startDate, endDate) {
  const [totalVisitors] = await db.query(
    `SELECT COUNT(*) AS total FROM visitors WHERE created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [approvedCount] = await db.query(
    `SELECT COUNT(*) AS total FROM visitors WHERE status = 'approved' AND created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [visitTrend] = await db.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count 
     FROM visitors WHERE created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at) ORDER BY date ASC`,
    [startDate, endDate]
  );

  const [visitorTypes] = await db.query(
    `SELECT visitor_type, COUNT(*) AS count FROM visitors 
     WHERE created_at BETWEEN ? AND ? GROUP BY visitor_type`,
    [startDate, endDate]
  );

  const [approvalStatus] = await db.query(
    `SELECT status, COUNT(*) AS count FROM visitors 
     WHERE created_at BETWEEN ? AND ? GROUP BY status`,
    [startDate, endDate]
  );

  const [peakHours] = await db.query(
    `SELECT HOUR(created_at) AS hour, COUNT(*) AS count FROM visitors 
     WHERE created_at BETWEEN ? AND ? GROUP BY HOUR(created_at) ORDER BY hour ASC`,
    [startDate, endDate]
  );

  return {
    totalVisitors: Number(totalVisitors[0]?.total || 0),
    approvalRate: totalVisitors[0]?.total ? 
      ((Number(approvedCount[0]?.total || 0) / Number(totalVisitors[0]?.total)) * 100).toFixed(2) : 0,
    visitTrend: visitTrend.map(r => ({ date: r.date, count: r.count })),
    visitorTypes: visitorTypes.map(r => ({ name: r.visitor_type, value: r.count })),
    approvalStatus: approvalStatus.map(r => ({ name: r.status, value: r.count })),
    peakHours: peakHours.map(r => ({ hour: `${r.hour}:00`, visitors: r.count })),
  };
}

// ============ FINANCIAL ANALYTICS ============
async function getFinancialAnalytics(startDate, endDate) {
  const [totalRevenue] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM bills 
     WHERE status = 'paid' AND paid_date BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [collectionRate] = await db.query(
    `SELECT 
      COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid,
      COUNT(*) AS total
     FROM bills WHERE created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [monthlyRevenue] = await db.query(
    `SELECT DATE_FORMAT(paid_date, '%Y-%m') AS month, COALESCE(SUM(amount), 0) AS total
     FROM bills WHERE status = 'paid' AND paid_date BETWEEN ? AND ?
     GROUP BY DATE_FORMAT(paid_date, '%Y-%m') ORDER BY month ASC`,
    [startDate, endDate]
  );

  const [billStatus] = await db.query(
    `SELECT status, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount FROM bills 
     WHERE created_at BETWEEN ? AND ? GROUP BY status`,
    [startDate, endDate]
  );

  const [topDefaulters] = await db.query(
    `SELECT u.name, COUNT(b.id) AS unpaid_count, COALESCE(SUM(b.amount), 0) AS total_amount
     FROM bills b JOIN users u ON b.user_id = u.id
     WHERE b.status = 'unpaid' AND b.created_at BETWEEN ? AND ?
     GROUP BY b.user_id ORDER BY total_amount DESC LIMIT 5`,
    [startDate, endDate]
  );

  return {
    totalRevenue: Number(totalRevenue[0]?.total || 0),
    collectionRate: collectionRate[0]?.total ? 
      ((Number(collectionRate[0]?.paid || 0) / Number(collectionRate[0]?.total)) * 100).toFixed(2) : 0,
    monthlyRevenue: monthlyRevenue.map(r => ({ month: r.month, revenue: Number(r.total) })),
    billStatus: billStatus.map(r => ({ name: r.status, count: r.count, amount: Number(r.amount) })),
    topDefaulters: topDefaulters.map(r => ({ name: r.name, count: r.unpaid_count, amount: Number(r.total_amount) })),
  };
}

// ============ COMPLAINT ANALYTICS ============
async function getComplaintAnalytics(startDate, endDate) {
  const [totalComplaints] = await db.query(
    `SELECT COUNT(*) AS total FROM complaints WHERE created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [resolvedCount] = await db.query(
    `SELECT COUNT(*) AS total FROM complaints 
     WHERE status = 'resolved' AND created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [complaintTrend] = await db.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count 
     FROM complaints WHERE created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at) ORDER BY date ASC`,
    [startDate, endDate]
  );

  const [complaintStatus] = await db.query(
    `SELECT status, COUNT(*) AS count FROM complaints 
     WHERE created_at BETWEEN ? AND ? GROUP BY status`,
    [startDate, endDate]
  );

  const [complaintCategory] = await db.query(
    `SELECT category, COUNT(*) AS count FROM complaints 
     WHERE created_at BETWEEN ? AND ? GROUP BY category ORDER BY count DESC LIMIT 5`,
    [startDate, endDate]
  );

  const [avgResolutionTime] = await db.query(
    `SELECT AVG(DATEDIFF(updated_at, created_at)) AS avg_days FROM complaints 
     WHERE status = 'resolved' AND created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  return {
    totalComplaints: Number(totalComplaints[0]?.total || 0),
    resolutionRate: totalComplaints[0]?.total ? 
      ((Number(resolvedCount[0]?.total || 0) / Number(totalComplaints[0]?.total)) * 100).toFixed(2) : 0,
    complaintTrend: complaintTrend.map(r => ({ date: r.date, count: r.count })),
    complaintStatus: complaintStatus.map(r => ({ name: r.status, value: r.count })),
    topCategories: complaintCategory.map(r => ({ category: r.category, count: r.count })),
    avgResolutionDays: Number(avgResolutionTime[0]?.avg_days || 0).toFixed(1),
  };
}

// ============ CHAT ANALYTICS ============
async function getChatAnalytics(startDate, endDate) {
  const [totalMessages] = await db.query(
    `SELECT COUNT(*) AS total FROM chats WHERE created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [activeUsers] = await db.query(
    `SELECT COUNT(DISTINCT user_id) AS count FROM chats WHERE created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [messageTrend] = await db.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count 
     FROM chats WHERE created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at) ORDER BY date ASC`,
    [startDate, endDate]
  );

  const [chatChannels] = await db.query(
    `SELECT thread_id, COUNT(*) AS message_count FROM chats 
     WHERE created_at BETWEEN ? AND ? GROUP BY thread_id ORDER BY message_count DESC LIMIT 10`,
    [startDate, endDate]
  );

  const [avgResponseTime] = await db.query(
    `SELECT AVG(TIMESTAMPDIFF(MINUTE, c1.created_at, c2.created_at)) AS avg_minutes
     FROM chats c1 JOIN chats c2 ON c1.thread_id = c2.thread_id 
     AND c1.user_id != c2.user_id AND c1.id < c2.id
     WHERE c1.created_at BETWEEN ? AND ? LIMIT 1000`,
    [startDate, endDate]
  );

  return {
    totalMessages: Number(totalMessages[0]?.total || 0),
    activeUsers: Number(activeUsers[0]?.count || 0),
    messageTrend: messageTrend.map(r => ({ date: r.date, count: r.count })),
    topChannels: chatChannels.map(r => ({ threadId: r.thread_id, messages: r.message_count })),
    avgResponseTimeMinutes: Number(avgResponseTime[0]?.avg_minutes || 0).toFixed(1),
  };
}

// ============ PAYMENT ANALYTICS ============
async function getPaymentAnalytics(startDate, endDate) {
  const [totalPayments] = await db.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS amount FROM bills 
     WHERE status = 'paid' AND paid_date BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [paymentMethods] = await db.query(
    `SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total 
     FROM bills WHERE status = 'paid' AND paid_date BETWEEN ? AND ?
     GROUP BY payment_method`,
    [startDate, endDate]
  );

  const [paymentTrend] = await db.query(
    `SELECT DATE(paid_date) AS date, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount
     FROM bills WHERE status = 'paid' AND paid_date BETWEEN ? AND ?
     GROUP BY DATE(paid_date) ORDER BY date ASC`,
    [startDate, endDate]
  );

  const [failedPayments] = await db.query(
    `SELECT COUNT(*) AS total FROM bills 
     WHERE status = 'failed' AND created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [successRate] = await db.query(
    `SELECT 
      COUNT(CASE WHEN status = 'paid' THEN 1 END) AS successful,
      COUNT(*) AS total
     FROM bills WHERE (status IN ('paid', 'failed') OR (status = 'unpaid' AND payment_attempts > 0))
     AND created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  return {
    totalPayments: Number(totalPayments[0]?.total || 0),
    totalAmount: Number(totalPayments[0]?.amount || 0),
    paymentMethods: paymentMethods.map(r => ({ 
      method: r.payment_method || 'Unknown', 
      count: r.count, 
      amount: Number(r.total) 
    })),
    paymentTrend: paymentTrend.map(r => ({ 
      date: r.date, 
      count: r.count, 
      amount: Number(r.amount) 
    })),
    failedPayments: Number(failedPayments[0]?.total || 0),
    successRate: successRate[0]?.total ? 
      ((Number(successRate[0]?.successful || 0) / Number(successRate[0]?.total)) * 100).toFixed(2) : 0,
  };
}

// ============ AI ANALYTICS ============
async function getAIAnalytics(startDate, endDate) {
  const [totalRequests] = await db.query(
    `SELECT COUNT(*) AS total FROM chats WHERE message_type = 'ai' AND created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [requestTrend] = await db.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count 
     FROM chats WHERE message_type = 'ai' AND created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at) ORDER BY date ASC`,
    [startDate, endDate]
  );

  // Note: These would typically come from an ai_logs table in production
  const [usageByFeature] = await db.query(
    `SELECT category AS feature, COUNT(*) AS count 
     FROM complaints WHERE created_at BETWEEN ? AND ? GROUP BY category LIMIT 5`,
    [startDate, endDate]
  );

  return {
    totalRequests: Number(totalRequests[0]?.total || 0),
    requestTrend: requestTrend.map(r => ({ date: r.date, count: r.count })),
    topFeatures: usageByFeature.map(r => ({ feature: r.feature, usage: r.count })),
    avgResponseQuality: (Math.random() * 30 + 70).toFixed(1), // Placeholder metric
  };
}

// ============ STAFF PERFORMANCE ============
async function getStaffPerformance(startDate, endDate) {
  const [staffList] = await db.query(
    `SELECT id, name, role FROM users WHERE role IN ('staff', 'guard', 'maintenance') AND society_id = ?`,
    [global.societyId || 1]
  );

  const performance = [];
  for (const staff of staffList) {
    const [complaints] = await db.query(
      `SELECT COUNT(*) AS total FROM complaints 
       WHERE assigned_to = ? AND created_at BETWEEN ? AND ?`,
      [staff.id, startDate, endDate]
    );

    const [resolved] = await db.query(
      `SELECT COUNT(*) AS total FROM complaints 
       WHERE assigned_to = ? AND status = 'resolved' AND created_at BETWEEN ? AND ?`,
      [staff.id, startDate, endDate]
    );

    const [taskCompletionTime] = await db.query(
      `SELECT AVG(DATEDIFF(updated_at, created_at)) AS avg_days FROM complaints 
       WHERE assigned_to = ? AND status = 'resolved' AND created_at BETWEEN ? AND ?`,
      [staff.id, startDate, endDate]
    );

    performance.push({
      staffName: staff.name,
      role: staff.role,
      tasksAssigned: Number(complaints[0]?.total || 0),
      tasksResolved: Number(resolved[0]?.total || 0),
      avgCompletionDays: Number(taskCompletionTime[0]?.avg_days || 0).toFixed(1),
      completionRate: complaints[0]?.total ? 
        ((Number(resolved[0]?.total || 0) / Number(complaints[0]?.total)) * 100).toFixed(2) : 0,
    });
  }

  return {
    staffPerformance: performance,
    totalStaff: staffList.length,
    avgCompletionRate: performance.length ? 
      (performance.reduce((sum, s) => sum + Number(s.completionRate), 0) / performance.length).toFixed(2) : 0,
  };
}

// ============ SECURITY ANALYTICS ============
async function getSecurityAnalytics(startDate, endDate) {
  const [totalAlerts] = await db.query(
    `SELECT COUNT(*) AS total FROM security_alerts WHERE created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [alertTrend] = await db.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count 
     FROM security_alerts WHERE created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at) ORDER BY date ASC`,
    [startDate, endDate]
  );

  const [alertSeverity] = await db.query(
    `SELECT severity, COUNT(*) AS count FROM security_alerts 
     WHERE created_at BETWEEN ? AND ? GROUP BY severity`,
    [startDate, endDate]
  );

  const [alertType] = await db.query(
    `SELECT alert_type, COUNT(*) AS count FROM security_alerts 
     WHERE created_at BETWEEN ? AND ? GROUP BY alert_type ORDER BY count DESC`,
    [startDate, endDate]
  );

  const [incidentsByLocation] = await db.query(
    `SELECT location, COUNT(*) AS count FROM security_alerts 
     WHERE created_at BETWEEN ? AND ? GROUP BY location ORDER BY count DESC LIMIT 10`,
    [startDate, endDate]
  );

  return {
    totalAlerts: Number(totalAlerts[0]?.total || 0),
    alertTrend: alertTrend.map(r => ({ date: r.date, count: r.count })),
    severityBreakdown: alertSeverity.map(r => ({ severity: r.severity, count: r.count })),
    topAlertTypes: alertType.map(r => ({ type: r.alert_type, count: r.count })),
    incidentsByLocation: incidentsByLocation.map(r => ({ location: r.location, count: r.count })),
  };
}

// ============ EXPORT UTILITIES ============
async function getFullAnalyticsData(startDate, endDate) {
  const [data] = await Promise.all([
    Promise.all([
      getVisitorAnalytics(startDate, endDate),
      getFinancialAnalytics(startDate, endDate),
      getComplaintAnalytics(startDate, endDate),
      getChatAnalytics(startDate, endDate),
      getPaymentAnalytics(startDate, endDate),
      getAIAnalytics(startDate, endDate),
      getStaffPerformance(startDate, endDate),
      getSecurityAnalytics(startDate, endDate),
    ]),
  ]);

  return {
    visitor: data[0],
    financial: data[1],
    complaint: data[2],
    chat: data[3],
    payment: data[4],
    ai: data[5],
    staff: data[6],
    security: data[7],
  };
}

module.exports = {
  // Legacy
  getTotalResidents,
  getPendingComplaints,
  getUnpaidBills,
  getComplaintStatusBreakdown,
  getBillStatusBreakdown,
  getMonthlyComplaintsAndBills,
  // Analytics Domains
  getVisitorAnalytics,
  getFinancialAnalytics,
  getComplaintAnalytics,
  getChatAnalytics,
  getPaymentAnalytics,
  getAIAnalytics,
  getStaffPerformance,
  getSecurityAnalytics,
  getFullAnalyticsData,
};
