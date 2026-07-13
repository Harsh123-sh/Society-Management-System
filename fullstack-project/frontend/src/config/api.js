function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$|\/$/, "");
}

function isLocalBrowserHost() {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname;
  return ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname) ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
}

const configuredApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const localApiUrl = import.meta.env.VITE_LOCAL_API_URL || configuredApiUrl || "http://127.0.0.1:5001";

export const API_BASE_URL = trimTrailingSlash(
  isLocalBrowserHost()
    ? localApiUrl
    : configuredApiUrl || "https://society-management-system-vimk.onrender.com"
);

export default API_BASE_URL;
