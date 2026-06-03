require("dotenv").config();
const db = require("../db");

const queries = [
  [
    "societyStats",
    "SELECT COUNT(*) AS total_societies, COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_societies, COUNT(CASE WHEN status = 'trial' THEN 1 END) AS pending_society_requests, COUNT(CASE WHEN status = 'suspended' THEN 1 END) AS suspended_societies FROM societies",
  ],
  [
    "userStats",
    "SELECT COUNT(*) AS total_users, COUNT(CASE WHEN role = 'resident' AND status = 'active' THEN 1 END) AS active_residents, COUNT(CASE WHEN role = 'admin' AND status = 'pending' THEN 1 END) AS chairman_requests, COUNT(CASE WHEN role = 'secretary' AND status = 'pending' THEN 1 END) AS secretary_requests, COUNT(CASE WHEN role = 'security' AND status = 'active' THEN 1 END) AS active_security_staff FROM users",
  ],
  [
    "complaintStats",
    "SELECT COUNT(*) AS total_complaints, COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_complaints, COUNT(CASE WHEN status = 'resolved' THEN 1 END) AS resolved_complaints FROM complaints",
  ],
  [
    "flatStats",
    "SELECT COUNT(*) AS total_flats, COUNT(CASE WHEN status = 'occupied' THEN 1 END) AS occupied_flats, COUNT(CASE WHEN status = 'vacant' THEN 1 END) AS vacant_flats FROM flats",
  ],
  [
    "subscriptionStats",
    "SELECT COUNT(*) AS total_subscriptions, COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_subscriptions, COUNT(CASE WHEN status = 'trial' THEN 1 END) AS trial_subscriptions, COUNT(CASE WHEN status = 'past_due' THEN 1 END) AS past_due_subscriptions, COUNT(CASE WHEN renewal_at IS NOT NULL AND renewal_at <= DATE_ADD(NOW(), INTERVAL 14 DAY) THEN 1 END) AS expiring_soon FROM society_subscriptions",
  ],
  [
    "revenueRows",
    "SELECT COALESCE(SUM(amount), 0) AS collected_revenue, COUNT(*) AS paid_payments FROM bill_payments WHERE status IN ('authorized', 'captured') OR gateway_payment_id IS NOT NULL",
  ],
  [
    "approvalRows",
    "SELECT COUNT(*) AS pending_approvals FROM user_approvals WHERE status = 'pending'",
  ],
  [
    "loginRows",
    "SELECT COUNT(*) AS login_events FROM audit_logs WHERE action LIKE '%login%' OR action IN ('security_login', 'login_success', 'super_admin_login')",
  ],
];

async function main() {
  for (const [label, sql] of queries) {
    try {
      const { rows } = await db.query(sql);
      console.log(label, "OK", JSON.stringify(rows[0]));
    } catch (error) {
      console.log(label, "ERR", error.code, error.sqlMessage || error.message);
    }
  }
}

main()
  .catch((error) => {
    console.error(error.code || "ERROR", error.sqlMessage || error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end().catch(() => null);
  });
