import { api } from "./authApi";

export async function fetchAllBills(params = {}) {
  const { data } = await api.get("/bills", { params });
  return data;
}

export async function fetchMyBills(params = {}) {
  const { data } = await api.get("/bills/my", { params });
  return data;
}

export async function createBill(payload) {
  const { data } = await api.post("/bills", payload);
  return data;
}

export async function createAutoInvoices(payload) {
  const { data } = await api.post("/bills/auto-invoices", payload);
  return data;
}

export async function createBillTemplate(payload) {
  const { data } = await api.post("/bills/templates", payload);
  return data;
}

export async function markBillPaid(billId) {
  const { data } = await api.patch(`/bills/${billId}/pay`);
  return data;
}

export async function fetchBillingDashboard() {
  const { data } = await api.get("/bills/dashboard");
  return data;
}

export async function fetchFinancialAnalytics() {
  const { data } = await api.get("/bills/analytics/financial");
  return data;
}

export async function runLateFeeAutomation(payload) {
  const { data } = await api.post("/bills/automations/late-fees", payload);
  return data;
}

export async function runPaymentReminders(payload) {
  const { data } = await api.post("/bills/automations/reminders", payload);
  return data;
}

export async function fetchInvoice(billId) {
  const { data } = await api.get(`/bills/invoices/${billId}`);
  return data;
}

export async function fetchMyPaymentPortal() {
  const { data } = await api.get("/bills/my/portal");
  return data;
}

export async function createPaymentOrder(billId, payload) {
  const { data } = await api.post(`/bills/${billId}/payments/order`, payload);
  return data;
}

export async function verifyRazorpayPayment(billId, payload) {
  const { data } = await api.post(`/bills/${billId}/payments/verify-razorpay`, payload);
  return data;
}

export async function payViaUpi(billId, payload) {
  const { data } = await api.post(`/bills/${billId}/payments/upi`, payload);
  return data;
}

export async function fetchResidents() {
  const { data } = await api.get("/users");
  return data;
}
