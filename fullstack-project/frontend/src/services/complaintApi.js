import { api } from "./authApi";

export async function raiseComplaint(payload) {
  const { data } = await api.post("/complaints", payload);
  return data;
}

export async function fetchMyComplaints(params = {}) {
  const { data } = await api.get("/complaints/my", { params });
  return data;
}

export async function fetchAllComplaints(params = {}) {
  const { data } = await api.get("/complaints", { params });
  return data;
}

export async function updateComplaintStatus(complaintId, status) {
  const { data } = await api.patch(`/complaints/${complaintId}/status`, {
    status,
  });
  return data;
}

export async function addComplaintComment(complaintId, comment) {
  const { data } = await api.post(`/complaints/${complaintId}/comments`, {
    comment,
  });
  return data;
}
