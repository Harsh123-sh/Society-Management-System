const crypto = require("crypto");
const billModel = require("../models/billModel");
const userModel = require("../models/userModel");
const notificationModel = require("../models/notificationModel");
const { generateAnalytics } = require("../services/aiAssistantService");

function groupChargesByBillId(bills, charges) {
  const chargeMap = new Map();

  for (const charge of charges) {
    if (!chargeMap.has(charge.bill_id)) {
      chargeMap.set(charge.bill_id, []);
    }
    chargeMap.get(charge.bill_id).push(charge);
  }

  return bills.map((bill) => ({
    ...bill,
    charges: chargeMap.get(bill.id) || [],
  }));
}

function buildInvoicePayload(bill) {
  const invoiceDate = new Date().toISOString();
  return {
    invoiceNumber: bill.invoice_number,
    invoiceDate,
    resident: {
      id: bill.resident_id,
      name: bill.resident_name,
      email: bill.resident_email,
    },
    bill: {
      id: bill.id,
      type: bill.bill_type,
      title: bill.title,
      billingMonth: bill.billing_month,
      dueDate: bill.due_date,
      status: bill.status,
      paymentStatus: bill.payment_status,
      totalAmount: Number(bill.total_amount || 0),
      paidAmount: Number(bill.paid_amount || 0),
      balanceAmount: Number(bill.total_amount || 0) - Number(bill.paid_amount || 0),
      lateFeeAmount: Number(bill.late_fee_amount || 0),
      charges: bill.charges || [],
    },
    paymentInfo: {
      gatewayProvider: bill.gateway_provider,
      gatewayOrderId: bill.gateway_order_id,
      gatewayPaymentId: bill.gateway_payment_id,
      upiReference: bill.upi_reference,
      paidAt: bill.paid_at,
    },
  };
}

async function createBill(req, res) {
  try {
    // CRITICAL: Society access validation
    if (!req.user?.societyId) {
      return res.status(403).json({ success: false, message: "Society context required" });
    }

    const {
      residentId,
      title,
      dueDate,
      billingMonth = null,
      billType = "maintenance",
      charges = [],
      notes = null,
    } = req.body;

    if (!residentId || !title || !dueDate || !Array.isArray(charges) || !charges.length) {
      return res.status(400).json({
        success: false,
        message: "residentId, title, dueDate and at least one charge are required",
      });
    }

    // Basic charge validation
    for (const charge of charges) {
      if (!charge.charge_name || Number(charge.amount) <= 0) {
        return res.status(400).json({ success: false, message: "Each charge must include charge_name and amount > 0" });
      }
    }

    const resident = await userModel.getUserById(residentId);
    if (!resident || resident.role !== "resident") {
      return res.status(404).json({ success: false, message: "Resident not found" });
    }

    // Ensure resident belongs to same society as current user (or super_admin bypass)
    if (req.user.role !== "super_admin") {
      if (!resident.society_id || resident.society_id !== req.user.societyId) {
        return res.status(403).json({ success: false, message: "Cannot create bill for resident in different society" });
      }
    }

    const billId = await billModel.createBillWithCharges({
      residentId,
      societyId: resident.society_id || req.user.societyId || null,
      builderId: resident.builder_id || req.user.builder_id || null,
      title,
      dueDate,
      billingMonth,
      billType,
      notes,
      charges,
      createdBy: req.user.id,
    });

    const bill = await billModel.getBillById(billId);

    return res.status(201).json({ success: true, message: "Bill created successfully", data: bill });
  } catch (error) {
    console.error("createBill error:", error?.message || error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createAutoInvoices(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const {
      residentIds = [],
      title,
      dueDate,
      billingMonth = null,
      billType = "maintenance",
      charges = [],
    } = req.body;

    if (!Array.isArray(residentIds) || !residentIds.length || !title || !dueDate || !charges.length) {
      return res.status(400).json({
        success: false,
        message: "residentIds, title, dueDate, and charges are required",
      });
    }

    const sanitizedResidentIds = residentIds.map(Number).filter(Boolean);
    const residents = await Promise.all(sanitizedResidentIds.map((id) => userModel.getUserById(id)));
    const scopedResidentIds = residents
      .filter((resident) => resident && resident.role === "resident" && (!societyId || resident.society_id === societyId))
      .map((resident) => resident.id);

    if (!scopedResidentIds.length) {
      return res.status(400).json({ success: false, message: "No valid residents found in current society" });
    }

    const created = await billModel.createAutoInvoices({
      residentIds: scopedResidentIds,
      societyId,
      billType,
      dueDate,
      billingMonth,
      title,
      chargeTemplate: charges,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Auto invoices generated",
      data: {
        billIds: created,
        count: created.length,
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getAllBills(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const status = req.query.status ? String(req.query.status).trim() : "";
    const billType = req.query.billType ? String(req.query.billType).trim() : "";
    const paymentStatus = req.query.paymentStatus ? String(req.query.paymentStatus).trim() : "";

    const bills = await billModel.getBillsForAdmin({ search, status, billType, paymentStatus, societyId });
    const charges = await billModel.getChargesByBillIds(bills.map((bill) => bill.id));

    return res.json({
      success: true,
      data: groupChargesByBillId(bills, charges),
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getMyBills(req, res) {
  try {
    const search = req.query.search ? String(req.query.search).trim() : "";
    const status = req.query.status ? String(req.query.status).trim() : "";
    const billType = req.query.billType ? String(req.query.billType).trim() : "";
    const paymentStatus = req.query.paymentStatus ? String(req.query.paymentStatus).trim() : "";

    const bills = await billModel.getBillsForResident(req.user.id, {
      search,
      status,
      billType,
      paymentStatus,
    });
    const charges = await billModel.getChargesByBillIds(bills.map((bill) => bill.id));

    return res.json({
      success: true,
      data: groupChargesByBillId(bills, charges),
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getMyPaymentPortal(req, res) {
  try {
    const portalData = await billModel.getResidentPaymentPortal(req.user.id);
    return res.json({
      success: true,
      data: portalData,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function markMyBillPaid(req, res) {
  try {
    const billId = Number(req.params.id);

    if (!billId) {
      return res.status(400).json({
        success: false,
        message: "Valid bill id is required",
      });
    }

    const myBills = await billModel.getBillsForResident(req.user.id);
    const selectedBill = myBills.find((bill) => bill.id === billId);

    if (!selectedBill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found for this resident",
      });
    }

    if (selectedBill.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Bill is already paid",
      });
    }

    await billModel.markBillPaid(billId);
    const updatedBill = await billModel.getBillById(billId);

    return res.json({
      success: true,
      message: "Bill marked as paid",
      data: updatedBill,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createPaymentOrder(req, res) {
  try {
    const billId = Number(req.params.id);
    const method = String(req.body?.method || "upi").toLowerCase();
    const gatewayProvider = method === "razorpay" ? "razorpay" : "upi";

    const myBills = await billModel.getBillsForResident(req.user.id);
    const bill = myBills.find((row) => row.id === billId);

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    const balanceAmount = Number(bill.total_amount || 0) - Number(bill.paid_amount || 0);
    if (balanceAmount <= 0) {
      return res.status(400).json({ success: false, message: "Bill already settled" });
    }

    const amount = Number(req.body?.amount || balanceAmount);
    if (amount <= 0 || amount > balanceAmount) {
      return res.status(400).json({ success: false, message: "Invalid payment amount" });
    }

    let razorpayOrderId = null;
    if (gatewayProvider === "razorpay" && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const basicToken = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            Authorization: `Basic ${basicToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `bill_${billId}_${Date.now()}`,
            notes: {
              billId,
              residentId: req.user.id,
            },
          }),
        });

        if (response.ok) {
          const payload = await response.json();
          razorpayOrderId = payload.id;
        }
      } catch (_error) {
        razorpayOrderId = null;
      }
    }

    const order = await billModel.createPaymentOrder({
      billId,
      residentId: req.user.id,
      amount,
      paymentMethod: method,
      gatewayProvider,
      gatewayOrderId: razorpayOrderId,
      metadata: {
        upiId: req.body?.upiId || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      data: {
        paymentId: order.id,
        gatewayOrderId: order.gatewayOrderId,
        amount,
        currency: "INR",
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
        gatewayMode: razorpayOrderId ? "live" : "internal-fallback",
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function verifyRazorpayPayment(req, res) {
  try {
    const billId = Number(req.params.id);
    const {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body || {};

    if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Payment verification payload is incomplete" });
    }

    const payment = await billModel.getPaymentByOrderId(razorpayOrderId);
    if (!payment || Number(payment.id) !== Number(paymentId) || Number(payment.bill_id) !== billId) {
      return res.status(404).json({ success: false, message: "Payment order not found" });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(400).json({ success: false, message: "Razorpay key secret is not configured" });
    }

    const digest = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (digest !== razorpaySignature) {
      await billModel.capturePayment({
        paymentId,
        gatewayPaymentId: razorpayPaymentId,
        gatewaySignature: razorpaySignature,
        status: "failed",
      });

      return res.status(400).json({ success: false, message: "Invalid Razorpay signature" });
    }

    const updatedBill = await billModel.capturePayment({
      paymentId,
      gatewayPaymentId: razorpayPaymentId,
      gatewaySignature: razorpaySignature,
      status: "captured",
      metadata: {
        verifiedBy: "razorpay_signature",
      },
    });

    return res.json({
      success: true,
      message: "Payment verified and captured",
      data: updatedBill,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function payViaUpi(req, res) {
  try {
    const billId = Number(req.params.id);
    const { paymentId, upiReference, upiId } = req.body || {};

    if (!paymentId || !upiReference) {
      return res.status(400).json({ success: false, message: "paymentId and upiReference are required" });
    }

    const updatedBill = await billModel.capturePayment({
      paymentId,
      upiReference,
      status: "captured",
      metadata: {
        paymentMethod: "upi",
        upiId: upiId || null,
      },
    });

    if (!updatedBill || Number(updatedBill.id) !== billId) {
      return res.status(404).json({ success: false, message: "Bill payment not found" });
    }

    return res.json({
      success: true,
      message: "UPI payment recorded",
      data: updatedBill,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function generateInvoice(req, res) {
  try {
    const billId = Number(req.params.id);
    const bill = await billModel.getBillById(billId);

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    if (![bill.resident_id, bill.created_by].includes(Number(req.user.id)) && !["admin", "secretary", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    return res.json({
      success: true,
      data: buildInvoicePayload(bill),
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function runLateFeeAutomation(req, res) {
  try {
    const lateFeeType = String(req.body?.lateFeeType || "percentage").toLowerCase();
    const lateFeeValue = Number(req.body?.lateFeeValue || 5);
    const graceDays = Number(req.body?.graceDays || 0);

    const result = await billModel.applyLateFeeAutomation({
      runBy: req.user.id,
      lateFeeType,
      lateFeeValue,
      graceDays,
    });

    return res.json({
      success: true,
      message: "Late fee automation completed",
      data: result,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function runPaymentReminders(req, res) {
  try {
    const dueSoonDays = Number(req.body?.dueSoonDays || 3);
    const pendingBills = await billModel.getBillsForAdmin({ status: "", paymentStatus: "" });

    const result = await billModel.createPaymentReminders({
      createdBy: req.user.id,
      dueSoonDays,
    });

    for (const bill of pendingBills) {
      const billStatus = String(bill.status || "").toLowerCase();
      const paymentStatus = String(bill.payment_status || "").toLowerCase();
      if (!["unpaid", "overdue", "partially_paid"].includes(billStatus) && !["pending", "failed", "partial"].includes(paymentStatus)) {
        continue;
      }

      const dueDate = bill.due_date ? new Date(bill.due_date) : null;
      const remainingAmount = Number(bill.total_amount || 0) - Number(bill.paid_amount || 0);
      if (!dueDate || remainingAmount <= 0) {
        continue;
      }

      const now = new Date();
      const dateOnlyNow = new Date(now.toISOString().slice(0, 10));
      const isOverdue = dueDate < dateOnlyNow;
      const dueSoonDate = new Date(dateOnlyNow);
      dueSoonDate.setDate(dueSoonDate.getDate() + dueSoonDays);
      if (!isOverdue && dueDate > dueSoonDate) {
        continue;
      }

      await notificationModel.createNotification({
        targetRole: "resident",
        targetUserId: bill.resident_id,
        title: isOverdue ? "Overdue maintenance payment" : "Upcoming maintenance payment",
        message: isOverdue
          ? `Your bill ${bill.invoice_number || bill.id} is overdue. Pending amount: INR ${remainingAmount.toFixed(2)}.`
          : `Your bill ${bill.invoice_number || bill.id} is due soon. Pending amount: INR ${remainingAmount.toFixed(2)}.`,
        priority: isOverdue ? "high" : "medium",
        category: "payment_reminder",
        relatedType: "bill",
        relatedId: bill.id,
        deepLink: `/billing/${bill.id}`,
      });
    }

    return res.json({
      success: true,
      message: "Payment reminders processed",
      data: result,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getBillingDashboard(req, res) {
  try {
    const dashboard = await billModel.getBillingDashboard();
    return res.json({ success: true, data: dashboard });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getFinancialAnalytics(req, res) {
  try {
    const analyticsData = await billModel.getFinancialAnalyticsData();

    let aiInsights = null;
    try {
      const aiStats = await generateAnalytics({ societyId: req.user?.societyId || req.user?.society_id || null });
      const collectionRate = analyticsData.collectionEfficiency.at(-1)?.collectionRate || 0;
      const highRiskDefaulters = analyticsData.defaulters.filter((item) => Number(item.outstandingAmount) > 5000).length;

      aiInsights = {
        summary: `Collection rate is ${collectionRate}%. High-risk defaulters detected: ${highRiskDefaulters}.`,
        recommendations: [
          "Schedule reminder campaigns 3 days before due date and on due date.",
          "Apply dynamic late fee slabs for repeat defaulters.",
          "Offer UPI-first one-click payment links for faster conversion.",
        ],
        aiContext: aiStats,
      };
    } catch (_error) {
      aiInsights = {
        summary: "AI insight generation is currently unavailable.",
        recommendations: [],
      };
    }

    return res.json({
      success: true,
      data: {
        ...analyticsData,
        aiInsights,
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  createBill,
  createAutoInvoices,
  getAllBills,
  getMyBills,
  getMyPaymentPortal,
  markMyBillPaid,
  createPaymentOrder,
  verifyRazorpayPayment,
  payViaUpi,
  generateInvoice,
  runLateFeeAutomation,
  runPaymentReminders,
  getBillingDashboard,
  getFinancialAnalytics,
};
