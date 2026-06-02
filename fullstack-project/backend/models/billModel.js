const db = require("../db");

function toJson(value) {
  return JSON.stringify(value ?? null);
}

function fromJson(value, fallback = null) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function generateInvoiceNumber(seedId) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `INV-${yyyy}${mm}-${String(seedId).padStart(6, "0")}`;
}

async function createBillWithCharges({
  residentId,
  societyId = null,
  builderId = null,
  title,
  dueDate,
  billingMonth = null,
  billType = "maintenance",
  charges,
  notes = null,
  createdBy,
}) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const totalAmount = charges.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const [billResult] = await connection.query(
      `INSERT INTO bills (
        resident_id, society_id, builder_id, bill_type, title, due_date, billing_month,
        status, payment_status, total_amount, paid_amount, created_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', ?, 0, ?, ?)`,
      [residentId, societyId, builderId, billType, title, dueDate, billingMonth, totalAmount, createdBy, notes]
    );

    const billId = billResult.insertId;
    const invoiceNumber = generateInvoiceNumber(billId);

    await connection.query("UPDATE bills SET invoice_number = ? WHERE id = ?", [invoiceNumber, billId]);

    for (const charge of charges) {
      await connection.query(
        "INSERT INTO bill_charges (bill_id, charge_name, charge_type, amount) VALUES (?, ?, ?, ?)",
        [billId, charge.charge_name, charge.charge_type || "misc", Number(charge.amount)]
      );
    }

    await connection.commit();
    return billId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createAutoInvoices({
  residentIds,
  societyId = null,
  builderId = null,
  billType = "maintenance",
  dueDate,
  billingMonth,
  title,
  chargeTemplate,
  createdBy,
}) {
  const createdBillIds = [];

  for (const residentId of residentIds) {
    const billId = await createBillWithCharges({
      residentId,
      societyId,
      builderId,
      title,
      dueDate,
      billingMonth,
      billType,
      charges: chargeTemplate,
      createdBy,
      notes: `Auto-generated invoice for ${billType}`,
    });
    createdBillIds.push(billId);
  }

  return createdBillIds;
}

async function getBillById(billId, { builderId = null, societyId = null } = {}) {
  const [billRows] = await db.query(
    `SELECT b.id, b.society_id, b.resident_id, b.bill_type, b.invoice_number, b.title,
            b.builder_id,
            b.due_date, b.billing_month, b.status, b.payment_status, b.total_amount,
            b.paid_amount, b.late_fee_amount, b.late_fee_applied_at, b.reminder_count,
            b.last_reminder_at, b.invoice_pdf_url, b.gateway_provider, b.gateway_order_id,
            b.gateway_payment_id, b.upi_reference, b.notes, b.created_by, b.paid_at,
            b.created_at, b.updated_at,
            resident.name AS resident_name, resident.email AS resident_email,
            creator.name AS created_by_name
     FROM bills b
     JOIN users resident ON resident.id = b.resident_id
     JOIN users creator ON creator.id = b.created_by
     WHERE b.id = ?` +
      (builderId ? " AND b.builder_id = ?" : "") +
      (societyId ? " AND b.society_id = ?" : "") + `
     LIMIT 1`,
    builderId || societyId ? [billId, ...(builderId ? [builderId] : []), ...(societyId ? [societyId] : [])] : [billId]
  );

  if (!billRows.length) {
    return null;
  }

  const [chargeRows] = await db.query(
    `SELECT id, bill_id, charge_name, charge_type, amount
     FROM bill_charges
     WHERE bill_id = ?
     ORDER BY id ASC`,
    [billId]
  );

  const [paymentRows] = await db.query(
    `SELECT id, bill_id, resident_id, amount, payment_method, gateway_provider,
            gateway_order_id, gateway_payment_id, gateway_signature, upi_id,
            upi_reference, status, metadata_json, paid_at, created_at, updated_at
     FROM bill_payments
     WHERE bill_id = ?
     ORDER BY id DESC`,
    [billId]
  );

  return {
    ...billRows[0],
    charges: chargeRows,
    payments: paymentRows.map((row) => ({
      ...row,
      metadata_json: fromJson(row.metadata_json, {}),
    })),
  };
}

async function getBillsForAdmin({ search, status, billType, paymentStatus, builderId = null, societyId = null } = {}) {
  const conditions = [];
  const params = [];

  if (builderId) {
    conditions.push("b.builder_id = ?");
    params.push(builderId);
  }

  if (societyId) {
    conditions.push("b.society_id = ?");
    params.push(societyId);
  }

  if (search) {
    conditions.push("(b.title LIKE ? OR resident.name LIKE ? OR resident.email LIKE ? OR b.invoice_number LIKE ?)");
    const likeQuery = `%${search}%`;
    params.push(likeQuery, likeQuery, likeQuery, likeQuery);
  }

  if (["draft", "unpaid", "overdue", "paid", "partially_paid"].includes(status)) {
    conditions.push("b.status = ?");
    params.push(status);
  }

  if (["maintenance", "parking", "utility", "other"].includes(billType)) {
    conditions.push("b.bill_type = ?");
    params.push(billType);
  }

  if (["pending", "partial", "paid", "failed", "refunded"].includes(paymentStatus)) {
    conditions.push("b.payment_status = ?");
    params.push(paymentStatus);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `SELECT b.id, b.society_id, b.resident_id, b.bill_type, b.invoice_number, b.title,
            b.builder_id,
            b.due_date, b.billing_month, b.status, b.payment_status, b.total_amount,
            b.paid_amount, b.late_fee_amount, b.reminder_count, b.paid_at, b.created_at,
            resident.name AS resident_name, resident.email AS resident_email,
            b.created_by, creator.name AS created_by_name
     FROM bills b
     JOIN users resident ON resident.id = b.resident_id
     JOIN users creator ON creator.id = b.created_by
     ${whereClause}
     ORDER BY b.created_at DESC`,
    params
  );

  return rows;
}

async function getBillsForResident(residentId, { search, status, billType, paymentStatus } = {}) {
  const conditions = ["b.resident_id = ?"];
  const params = [residentId];

  if (search) {
    conditions.push("(b.title LIKE ? OR b.invoice_number LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like);
  }

  if (["draft", "unpaid", "overdue", "paid", "partially_paid"].includes(status)) {
    conditions.push("b.status = ?");
    params.push(status);
  }

  if (["maintenance", "parking", "utility", "other"].includes(billType)) {
    conditions.push("b.bill_type = ?");
    params.push(billType);
  }

  if (["pending", "partial", "paid", "failed", "refunded"].includes(paymentStatus)) {
    conditions.push("b.payment_status = ?");
    params.push(paymentStatus);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `SELECT b.id, b.society_id, b.resident_id, b.bill_type, b.invoice_number, b.title,
            b.builder_id,
            b.due_date, b.billing_month, b.status, b.payment_status, b.total_amount,
            b.paid_amount, b.late_fee_amount, b.reminder_count, b.paid_at, b.created_at,
            resident.name AS resident_name, resident.email AS resident_email,
            b.created_by, creator.name AS created_by_name
     FROM bills b
     JOIN users resident ON resident.id = b.resident_id
     JOIN users creator ON creator.id = b.created_by
     ${whereClause}
     ORDER BY b.created_at DESC`,
    params
  );

  return rows;
}

async function getChargesByBillIds(billIds) {
  if (!billIds.length) {
    return [];
  }

  const placeholders = billIds.map(() => "?").join(",");
  const [rows] = await db.query(
    `SELECT id, bill_id, charge_name, charge_type, amount
     FROM bill_charges
     WHERE bill_id IN (${placeholders})
     ORDER BY bill_id ASC, id ASC`,
    billIds
  );

  return rows;
}

async function createPaymentOrder({
  billId,
  residentId,
  amount,
  paymentMethod,
  gatewayProvider,
  gatewayOrderId: providedOrderId = null,
  metadata = {},
}) {
  const gatewayOrderId =
    providedOrderId || `${gatewayProvider || "internal"}_order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const [result] = await db.query(
    `INSERT INTO bill_payments (
      bill_id, resident_id, amount, payment_method, gateway_provider,
      gateway_order_id, status, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, 'created', ?)`,
    [billId, residentId, amount, paymentMethod, gatewayProvider || null, gatewayOrderId, toJson(metadata)]
  );

  await db.query(
    `UPDATE bills
     SET gateway_provider = ?, gateway_order_id = ?
     WHERE id = ?`,
    [gatewayProvider || null, gatewayOrderId, billId]
  );

  return {
    id: result.insertId,
    gatewayOrderId,
  };
}

async function getPaymentByOrderId(gatewayOrderId) {
  const [rows] = await db.query(
    `SELECT *
     FROM bill_payments
     WHERE gateway_order_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [gatewayOrderId]
  );

  return rows[0] || null;
}

async function capturePayment({
  paymentId,
  gatewayPaymentId = null,
  gatewaySignature = null,
  upiReference = null,
  status = "captured",
  metadata = {},
}) {
  const [paymentRows] = await db.query(
    `SELECT id, bill_id, resident_id, amount, status AS current_status
     FROM bill_payments
     WHERE id = ?
     LIMIT 1`,
    [paymentId]
  );

  const payment = paymentRows[0] || null;
  if (!payment) {
    return null;
  }

  await db.query(
    `UPDATE bill_payments
     SET gateway_payment_id = COALESCE(?, gateway_payment_id),
         gateway_signature = COALESCE(?, gateway_signature),
         upi_reference = COALESCE(?, upi_reference),
         status = ?,
         metadata_json = ?,
         paid_at = CASE WHEN ? = 'captured' THEN NOW() ELSE paid_at END
     WHERE id = ?`,
    [
      gatewayPaymentId,
      gatewaySignature,
      upiReference,
      status,
      toJson(metadata),
      status,
      paymentId,
    ]
  );

  if (status === "captured") {
    await db.query(
      `UPDATE bills
       SET paid_amount = paid_amount + ?,
           gateway_payment_id = COALESCE(?, gateway_payment_id),
           upi_reference = COALESCE(?, upi_reference),
           paid_at = CASE WHEN paid_amount + ? >= total_amount THEN NOW() ELSE paid_at END,
           status = CASE
             WHEN paid_amount + ? >= total_amount THEN 'paid'
             ELSE 'partially_paid'
           END,
           payment_status = CASE
             WHEN paid_amount + ? >= total_amount THEN 'paid'
             ELSE 'partial'
           END
       WHERE id = ?`,
      [
        Number(payment.amount || 0),
        gatewayPaymentId,
        upiReference,
        Number(payment.amount || 0),
        Number(payment.amount || 0),
        Number(payment.amount || 0),
        payment.bill_id,
      ]
    );
  } else if (status === "failed") {
    await db.query("UPDATE bills SET payment_status = 'failed' WHERE id = ?", [payment.bill_id]);
  }

  return getBillById(payment.bill_id);
}

async function markBillPaid(billId) {
  const [result] = await db.query(
    `UPDATE bills
     SET status = 'paid', payment_status = 'paid', paid_amount = total_amount, paid_at = NOW()
     WHERE id = ? AND status <> 'paid'`,
    [billId]
  );

  return result.affectedRows > 0;
}

async function applyLateFeeAutomation({ runBy = null, lateFeeType = "percentage", lateFeeValue = 5, graceDays = 0 }) {
  const [rows] = await db.query(
    `SELECT id, total_amount
     FROM bills
     WHERE status IN ('unpaid', 'overdue', 'partially_paid')
       AND DATE(due_date) < DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [Number(graceDays || 0)]
  );

  let affected = 0;
  for (const bill of rows) {
    const feeAmount = lateFeeType === "fixed"
      ? Number(lateFeeValue)
      : Number(((Number(bill.total_amount) * Number(lateFeeValue)) / 100).toFixed(2));

    if (feeAmount <= 0) continue;

    await db.query(
      `INSERT INTO bill_charges (bill_id, charge_name, charge_type, amount)
       VALUES (?, 'Late fee', 'late_fee', ?)` ,
      [bill.id, feeAmount]
    );

    await db.query(
      `UPDATE bills
       SET total_amount = total_amount + ?,
           late_fee_amount = late_fee_amount + ?,
           late_fee_applied_at = NOW(),
           status = 'overdue'
       WHERE id = ?`,
      [feeAmount, feeAmount, bill.id]
    );

    affected += 1;
  }

  return {
    affected,
    runBy,
  };
}

async function createPaymentReminders({ createdBy = null, dueSoonDays = 3 }) {
  const [rows] = await db.query(
    `SELECT b.id AS bill_id, b.resident_id, b.total_amount, b.paid_amount, b.due_date,
            b.invoice_number, b.title, u.name AS resident_name
     FROM bills b
     JOIN users u ON u.id = b.resident_id
     WHERE b.status IN ('unpaid', 'overdue', 'partially_paid')
       AND DATE(b.due_date) <= DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
    [Number(dueSoonDays || 3)]
  );

  let created = 0;

  for (const row of rows) {
    const isOverdue = new Date(row.due_date) < new Date(new Date().toISOString().slice(0, 10));
    const reminderType = isOverdue ? "overdue" : "pre_due";
    const remainingAmount = Number(row.total_amount || 0) - Number(row.paid_amount || 0);

    const message = isOverdue
      ? `Bill ${row.invoice_number || row.bill_id} is overdue. Pending amount: INR ${remainingAmount.toFixed(2)}.`
      : `Bill ${row.invoice_number || row.bill_id} is due soon. Pending amount: INR ${remainingAmount.toFixed(2)}.`;

    await db.query(
      `INSERT INTO bill_reminders (bill_id, resident_id, reminder_type, channel, message, status, sent_at, created_by)
       VALUES (?, ?, ?, 'in_app', ?, 'sent', NOW(), ?)` ,
      [row.bill_id, row.resident_id, reminderType, message, createdBy]
    );

    await db.query(
      `UPDATE bills
       SET reminder_count = reminder_count + 1,
           last_reminder_at = NOW(),
           status = CASE WHEN status = 'unpaid' AND ? = 'overdue' THEN 'overdue' ELSE status END
       WHERE id = ?`,
      [reminderType, row.bill_id]
    );

    created += 1;
  }

  return {
    created,
  };
}

async function getBillingDashboard() {
  const [[totals]] = await db.query(
    `SELECT
        COUNT(*) AS totalBills,
        COALESCE(SUM(total_amount), 0) AS totalInvoiced,
        COALESCE(SUM(paid_amount), 0) AS totalCollected,
        COALESCE(SUM(CASE WHEN status IN ('unpaid', 'overdue', 'partially_paid') THEN total_amount - paid_amount ELSE 0 END), 0) AS totalOutstanding,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdueCount
     FROM bills`
  );

  const [billTypeBreakdown] = await db.query(
    `SELECT bill_type, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total
     FROM bills
     GROUP BY bill_type
     ORDER BY total DESC`
  );

  const [monthlyCollections] = await db.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
            COALESCE(SUM(total_amount), 0) AS invoiced,
            COALESCE(SUM(paid_amount), 0) AS collected
     FROM bills
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 8 MONTH)
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')
     ORDER BY month ASC`
  );

  const [recentPayments] = await db.query(
    `SELECT bp.id, bp.bill_id, bp.amount, bp.payment_method, bp.gateway_provider,
            bp.gateway_payment_id, bp.status, bp.paid_at, bp.created_at,
            b.invoice_number, u.name AS resident_name
     FROM bill_payments bp
     JOIN bills b ON b.id = bp.bill_id
     JOIN users u ON u.id = bp.resident_id
     ORDER BY bp.created_at DESC
     LIMIT 12`
  );

  return {
    totals,
    billTypeBreakdown,
    monthlyCollections,
    recentPayments,
  };
}

async function getResidentPaymentPortal(residentId) {
  const bills = await getBillsForResident(residentId, {});
  const charges = await getChargesByBillIds(bills.map((bill) => bill.id));

  const chargeMap = new Map();
  for (const charge of charges) {
    if (!chargeMap.has(charge.bill_id)) {
      chargeMap.set(charge.bill_id, []);
    }
    chargeMap.get(charge.bill_id).push(charge);
  }

  const [payments] = await db.query(
    `SELECT bp.id, bp.bill_id, bp.amount, bp.payment_method, bp.status, bp.paid_at, bp.created_at,
            b.invoice_number, b.title
     FROM bill_payments bp
     JOIN bills b ON b.id = bp.bill_id
     WHERE bp.resident_id = ?
     ORDER BY bp.created_at DESC`,
    [residentId]
  );

  return {
    bills: bills.map((bill) => ({
      ...bill,
      charges: chargeMap.get(bill.id) || [],
    })),
    payments,
  };
}

async function getFinancialAnalyticsData() {
  const [collectionEfficiency] = await db.query(
    `SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COALESCE(SUM(total_amount), 0) AS invoiced,
        COALESCE(SUM(paid_amount), 0) AS collected,
        CASE
          WHEN COALESCE(SUM(total_amount), 0) = 0 THEN 0
          ELSE ROUND((COALESCE(SUM(paid_amount), 0) / COALESCE(SUM(total_amount), 0)) * 100, 2)
        END AS collectionRate
     FROM bills
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')
     ORDER BY month ASC`
  );

  const [defaulterRows] = await db.query(
    `SELECT b.resident_id, u.name AS resident_name, u.email AS resident_email,
            COUNT(*) AS overdueBills,
            COALESCE(SUM(b.total_amount - b.paid_amount), 0) AS outstandingAmount
     FROM bills b
     JOIN users u ON u.id = b.resident_id
     WHERE b.status IN ('overdue', 'unpaid', 'partially_paid')
       AND DATE(b.due_date) < CURDATE()
     GROUP BY b.resident_id, u.name, u.email
     ORDER BY outstandingAmount DESC
     LIMIT 10`
  );

  return {
    collectionEfficiency,
    defaulters: defaulterRows,
  };
}

module.exports = {
  createBillWithCharges,
  createAutoInvoices,
  getBillById,
  getBillsForAdmin,
  getBillsForResident,
  getChargesByBillIds,
  createPaymentOrder,
  getPaymentByOrderId,
  capturePayment,
  markBillPaid,
  applyLateFeeAutomation,
  createPaymentReminders,
  getBillingDashboard,
  getResidentPaymentPortal,
  getFinancialAnalyticsData,
};
