import { API_BASE_URL } from "../config/api";

export function getApiBaseUrl() {
  return `${API_BASE_URL}/api`;
}

export function getBackendBaseUrl() {
  return API_BASE_URL;
}
