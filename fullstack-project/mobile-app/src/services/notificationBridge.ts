import api from './api';

export async function markNotificationRead(id: number) {
  await api.patch(`/api/notifications/${id}/read`);
}

export async function sendEmergencyAlert(payload: { message: string; location?: string }) {
  const { data } = await api.post('/api/security/emergency-alerts', {
    alertType: 'sos',
    severity: 'critical',
    message: payload.message,
    location: payload.location || 'Mobile app',
  });
  return data;
}
