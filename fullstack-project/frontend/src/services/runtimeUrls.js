function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  return trimTrailingSlash(
    import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
  );
}

export function getBackendBaseUrl() {
  return getApiBaseUrl().replace(/\/api$/, "") || "http://localhost:5000";
}
