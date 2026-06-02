import { api } from "./authApi";
import { fetchAiDashboardWidgets } from "./aiApi";

function normalizeParams(params = {}) {
  const query = {};

  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;

  if (params.days !== undefined && params.days !== null && params.days !== "") {
    query.days = Number(params.days) || 30;
  }

  return query;
}

function unwrapResponse(payload) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }

  return payload;
}

export async function fetchOverviewStats() {
  const { data } = await api.get("/analytics/overview");
  return data;
}

export async function fetchOwnerDashboard() {
  const { data } = await api.get("/analytics/owner-dashboard");
  return data;
}

// ============ NEW ANALYTICS ENDPOINTS ============

export async function fetchVisitorAnalytics(params = {}) {
  const { data } = await api.get("/analytics/visitor", { params });
  return data;
}

export async function fetchFinancialAnalytics(params = {}) {
  const { data } = await api.get("/analytics/financial", { params });
  return data;
}

export async function fetchComplaintAnalytics(params = {}) {
  const { data } = await api.get("/analytics/complaint", { params });
  return data;
}

export async function fetchChatAnalytics(params = {}) {
  const { data } = await api.get("/analytics/chat", { params });
  return data;
}

export async function fetchPaymentAnalytics(params = {}) {
  const { data } = await api.get("/analytics/payment", { params });
  return data;
}

export async function fetchAIAnalytics(params = {}) {
  const { data } = await api.get("/analytics/ai", { params });
  return data;
}

export async function fetchStaffPerformance(params = {}) {
  const { data } = await api.get("/analytics/staff-performance", { params });
  return data;
}

export async function fetchSecurityAnalytics(params = {}) {
  const { data } = await api.get("/analytics/security", { params });
  return data;
}

export async function fetchAllAnalytics(params = {}) {
  const { data } = await api.get("/analytics/all", { params: normalizeParams(params) });
  return data;
}

export async function fetchAnalyticsDashboardBundle(params = {}) {
  const query = normalizeParams(params);
  const [overview, analytics, aiWidgets] = await Promise.all([
    fetchOverviewStats(),
    fetchAllAnalytics(query),
    fetchAiDashboardWidgets(),
  ]);

  return {
    overview: unwrapResponse(overview),
    analytics: unwrapResponse(analytics),
    ai: unwrapResponse(aiWidgets),
    params: query,
  };
}

// ============ EXPORT ENDPOINTS ============

export async function exportAnalytics(format = 'json', type = 'all', params = {}) {
  const exportParams = { format, type, ...normalizeParams(params) };
  const response = await api.get("/analytics/export", { 
    params: exportParams,
    responseType: format === 'csv' ? 'blob' : 'json',
  });
  
  if (format === 'csv') {
    // Trigger download for CSV
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } else {
    // Trigger download for JSON
    const jsonString = JSON.stringify(response.data, null, 2);
    const url = window.URL.createObjectURL(new Blob([jsonString]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export async function exportAnalyticsReport({ format = "json", type = "all", params = {} } = {}) {
  return exportAnalytics(format, type, params);
}
