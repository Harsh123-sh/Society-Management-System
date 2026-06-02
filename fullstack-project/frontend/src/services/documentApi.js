import { api } from "./authApi";

export async function fetchAllDocuments(params = {}) {
  const { data } = await api.get("/documents", { params });
  return data;
}

export async function fetchMyDocuments(params = {}) {
  const { data } = await api.get("/documents/my", { params });
  return data;
}

export async function uploadTenantDocument({ file, documentType }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);

  const { data } = await api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function reviewDocument(documentId, payload) {
  const { data } = await api.patch(`/documents/${documentId}/review`, payload);
  return data;
}
