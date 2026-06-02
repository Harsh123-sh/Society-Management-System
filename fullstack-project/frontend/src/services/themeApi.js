import { api } from './authApi';

export async function fetchThemeCatalog() {
  const { data } = await api.get('/themes/societies');
  return data;
}

export async function fetchCurrentTheme() {
  const { data } = await api.get('/themes/current');
  return data;
}

export async function updateTheme(societyId, payload) {
  const { data } = await api.patch(`/themes/${societyId}`, payload);
  return data;
}

export async function generateTheme(payload) {
  const { data } = await api.post('/themes/generate', payload);
  return data;
}
