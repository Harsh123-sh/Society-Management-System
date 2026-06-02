import { api } from "./authApi";

export async function fetchBookings(params = {}) {
  const { data } = await api.get("/bookings", { params });
  return data;
}

export async function fetchBookingStats() {
  const { data } = await api.get("/bookings/stats");
  return data;
}

export async function createBooking(payload) {
  const { data } = await api.post("/bookings", payload);
  return data;
}

export async function approveBooking(bookingId) {
  const { data } = await api.patch(`/bookings/${bookingId}/approve`);
  return data;
}

export async function rejectBooking(bookingId) {
  const { data } = await api.patch(`/bookings/${bookingId}/reject`);
  return data;
}

export async function cancelBooking(bookingId) {
  const { data } = await api.patch(`/bookings/${bookingId}/cancel`);
  return data;
}