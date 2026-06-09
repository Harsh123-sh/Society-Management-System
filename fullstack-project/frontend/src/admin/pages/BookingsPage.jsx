import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import { getApiMessage } from "../../services/authApi";
import {
  approveBooking,
  cancelBooking,
  createBooking,
  fetchBookingStats,
  fetchBookings,
  rejectBooking,
} from "../../services/bookingsApi";

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [form, setForm] = useState({
    resource_type: "hall",
    booking_date: "",
    start_time: "",
    end_time: "",
    purpose: "",
    number_of_guests: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      const [bookingsResponse, statsResponse] = await Promise.all([
        fetchBookings(filterStatus === "all" ? {} : { status: filterStatus }),
        fetchBookingStats(),
      ]);
      setBookings(bookingsResponse.data || []);
      setStats(statsResponse.data || null);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load bookings") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const filteredBookings = bookings;

  const summary = useMemo(() => ({
    total: stats?.total_bookings ?? bookings.length,
    approved: stats?.approved_bookings ?? bookings.filter((booking) => booking.status === "approved").length,
    pending: stats?.pending_bookings ?? bookings.filter((booking) => booking.status === "pending").length,
    upcoming: stats?.upcoming_bookings ?? bookings.filter((booking) => new Date(booking.booking_date) >= new Date()).length,
  }), [bookings, stats]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      await createBooking({
        resourceType: form.resource_type,
        bookingDate: form.booking_date,
        startTime: form.start_time,
        endTime: form.end_time,
        purpose: form.purpose,
        numberOfGuests: form.number_of_guests ? Number(form.number_of_guests) : null,
      });
      setForm({ resource_type: "hall", booking_date: "", start_time: "", end_time: "", purpose: "", number_of_guests: "" });
      setAlert({ type: "success", message: "Booking created" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not create booking") });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(action, bookingId) {
    try {
      if (action === "approve") await approveBooking(bookingId);
      if (action === "reject") await rejectBooking(bookingId);
      if (action === "cancel") await cancelBooking(bookingId);
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not update booking") });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📅 Bookings</h1>
          <p className="mt-2 text-slate-600">Manage community hall and facility bookings</p>
        </div>
      </div>

      <AlertMessage type={alert.type} message={alert.message} />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Bookings", value: summary.total, icon: "📅", color: "from-blue-500 to-blue-600" },
          { label: "Approved", value: summary.approved, icon: "✓", color: "from-green-500 to-green-600" },
          { label: "Pending", value: summary.pending, icon: "⏳", color: "from-yellow-500 to-yellow-600" },
          { label: "This Month", value: summary.upcoming, icon: "📊", color: "from-purple-500 to-purple-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl bg-gradient-to-br ${stat.color} p-5 shadow-sm text-[var(--text-main)]`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </div>
              <span className="text-4xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Create Booking</h3>
        <form className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3" onSubmit={handleSubmit}>
          <select value={form.resource_type} onChange={(event) => setForm((prev) => ({ ...prev, resource_type: event.target.value }))} className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none">
            <option value="hall">Community Hall</option>
            <option value="ground">Open Ground</option>
            <option value="facility">Facility</option>
          </select>
          <input type="date" value={form.booking_date} onChange={(event) => setForm((prev) => ({ ...prev, booking_date: event.target.value }))} className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none" />
          <input type="time" value={form.start_time} onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))} className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none" />
          <input type="time" value={form.end_time} onChange={(event) => setForm((prev) => ({ ...prev, end_time: event.target.value }))} className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none" />
          <input type="text" value={form.purpose} onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value }))} placeholder="Purpose" className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none md:col-span-2" />
          <input type="number" min="0" value={form.number_of_guests} onChange={(event) => setForm((prev) => ({ ...prev, number_of_guests: event.target.value }))} placeholder="Guests" className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none" />
          <button type="submit" disabled={submitting} className="rounded-lg theme-surface px-6 py-3 font-semibold text-[var(--text-main)] hover:theme-surface disabled:opacity-60 md:col-span-3">{submitting ? "Saving..." : "Create Booking"}</button>
        </form>
      </section>

      {/* Filters */}
      <div className="flex gap-4 rounded-lg bg-white p-4 shadow-sm">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        <select className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none">
          <option>All Venues</option>
          <option>Community Hall</option>
          <option>Swimming Pool</option>
          <option>Gym</option>
          <option>Garden</option>
        </select>

        <input
          type="search"
          placeholder="Search bookings..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-lg bg-white p-4 shadow-sm">Loading bookings...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Booked By</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{booking.booked_by_name || booking.booked_by_email || "-"}</td>
                  <td className="px-4 py-3">{booking.resource_type}</td>
                  <td className="px-4 py-3">{new Date(booking.booking_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{booking.start_time} - {booking.end_time}</td>
                  <td className="px-4 py-3">{booking.purpose || "-"}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.status === "approved" ? "bg-green-100 text-green-700" : booking.status === "pending" ? "bg-yellow-100 text-yellow-700" : booking.status === "rejected" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{booking.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleAction("approve", booking.id)} className="rounded-md bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Approve</button>
                      <button onClick={() => handleAction("reject", booking.id)} className="rounded-md bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Reject</button>
                      <button onClick={() => handleAction("cancel", booking.id)} className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upcoming Bookings */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">📋 Upcoming Bookings</h3>
        
        <div className="mt-4 space-y-4">
          {filteredBookings
            .sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date))
            .slice(0, 5)
            .map((booking) => (
              <div
                key={booking.id}
                className={`rounded-lg p-4 border-l-4 ${
                  booking.status === "approved"
                    ? "border-green-500 bg-green-50"
                    : booking.status === "pending"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-red-500 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{booking.booked_by_name || booking.booked_by_email || "Resident"}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      📍 {booking.resource_type}
                    </p>
                    <p className="text-sm text-slate-600">
                      📅 {new Date(booking.booking_date).toLocaleDateString()} at {booking.start_time}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      🎯 {booking.purpose}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        booking.status === "approved"
                          ? "bg-green-200 text-green-700"
                          : booking.status === "pending"
                            ? "bg-yellow-200 text-yellow-700"
                            : "bg-red-200 text-red-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                    {booking.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction("approve", booking.id)} className="rounded-lg bg-green-500 px-3 py-1 text-xs font-semibold text-[var(--text-main)] hover:bg-green-600 transition-colors">
                          ✓
                        </button>
                        <button onClick={() => handleAction("reject", booking.id)} className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-[var(--text-main)] hover:bg-red-600 transition-colors">
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Facility Availability Calendar */}
      <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">📅 Facility Availability</h3>
        
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { venue: "Community Hall", available: "6/8", color: "green" },
            { venue: "Swimming Pool", available: "5/5", color: "blue" },
            { venue: "Gym", available: "4/5", color: "yellow" },
            { venue: "Garden", available: "3/3", color: "purple" },
          ].map((facility) => (
            <div
              key={facility.venue}
              className={`rounded-lg bg-white p-4 border-l-4 border-${facility.color}-500`}
            >
              <p className="font-semibold text-slate-900">{facility.venue}</p>
              <p className="mt-2 text-2xl font-bold text-slate-600">
                {facility.available}
              </p>
              <p className="text-sm text-slate-500">Available slots</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BookingsPage;
