function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$|\/$/, "");
}

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "https://society-management-system-vimk.onrender.com"
);

export default API_BASE_URL;
