import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = '';

export function setApiToken(token: string) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export async function login(payload: { email: string; password: string; societyCode?: string }) {
  const { data } = await api.post('/api/auth/login', payload);
  return data;
}

export async function fetchResidentDashboard() {
  const { data } = await api.get('/api/resident/dashboard');
  return data;
}

export async function fetchGuardDashboard() {
  const { data } = await api.get('/api/security/dashboard');
  return data;
}

export async function fetchAdminDashboard() {
  const { data } = await api.get('/api/analytics/dashboard');
  return data;
}

export async function fetchChatThreads() {
  const { data } = await api.get('/api/chat/conversations');
  return data;
}

export async function fetchNotifications() {
  const { data } = await api.get('/api/notifications');
  return data;
}

export default api;
