const db = require("../db");

async function createBooking(payload) {
  const {
    resourceType,
    resourceId,
    bookedBy,
    bookingDate,
    startTime,
    endTime,
    purpose,
    numberOfGuests,
    status,
  } = payload;

  const [result] = await db.promise().query(
    `INSERT INTO bookings (
      resource_type, resource_id, booked_by, booking_date, start_time, end_time,
      purpose, number_of_guests, status, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      resourceType,
      resourceId || null,
      bookedBy,
      bookingDate,
      startTime,
      endTime,
      purpose || null,
      numberOfGuests || null,
      status || "pending",
    ]
  );

  return result.insertId;
}

async function getBookings(filters = {}) {
  let query = `
    SELECT
      b.*,
      u.name AS booked_by_name,
      u.email AS booked_by_email,
      approver.name AS approved_by_name
    FROM bookings b
    LEFT JOIN users u ON u.id = b.booked_by
    LEFT JOIN users approver ON approver.id = b.approved_by
    WHERE 1=1
  `;

  const params = [];
  if (filters.status) {
    query += " AND b.status = ?";
    params.push(filters.status);
  }
  if (filters.resourceType) {
    query += " AND b.resource_type = ?";
    params.push(filters.resourceType);
  }
  if (filters.bookedBy) {
    query += " AND b.booked_by = ?";
    params.push(filters.bookedBy);
  }

  query += " ORDER BY b.booking_date DESC, b.start_time DESC, b.id DESC";
  const [rows] = await db.promise().query(query, params);
  return rows;
}

async function getBookingById(bookingId) {
  const [rows] = await db.promise().query(
    `SELECT
      b.*,
      u.name AS booked_by_name,
      u.email AS booked_by_email,
      approver.name AS approved_by_name
     FROM bookings b
     LEFT JOIN users u ON u.id = b.booked_by
     LEFT JOIN users approver ON approver.id = b.approved_by
     WHERE b.id = ?
     LIMIT 1`,
    [bookingId]
  );

  return rows[0] || null;
}

async function updateBookingStatus(bookingId, status, approvedBy = null) {
  const [result] = await db.promise().query(
    `UPDATE bookings
     SET status = ?, approved_by = ?, approved_at = IF(? IN ('approved','confirmed'), NOW(), approved_at)
     WHERE id = ?`,
    [status, approvedBy, status, bookingId]
  );
  return result.affectedRows > 0;
}

async function updateBooking(bookingId, payload) {
  const [result] = await db.promise().query(
    `UPDATE bookings
     SET resource_type = COALESCE(?, resource_type),
         resource_id = COALESCE(?, resource_id),
         booking_date = COALESCE(?, booking_date),
         start_time = COALESCE(?, start_time),
         end_time = COALESCE(?, end_time),
         purpose = COALESCE(?, purpose),
         number_of_guests = COALESCE(?, number_of_guests),
         notes = COALESCE(?, notes)
     WHERE id = ?`,
    [
      payload.resourceType || null,
      payload.resourceId || null,
      payload.bookingDate || null,
      payload.startTime || null,
      payload.endTime || null,
      payload.purpose || null,
      payload.numberOfGuests || null,
      payload.notes || null,
      bookingId,
    ]
  );
  return result.affectedRows > 0;
}

async function deleteBooking(bookingId) {
  const [result] = await db.promise().query(`DELETE FROM bookings WHERE id = ?`, [bookingId]);
  return result.affectedRows > 0;
}

async function getBookingStats() {
  const [rows] = await db.promise().query(
    `SELECT
      COUNT(*) AS total_bookings,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_bookings,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_bookings,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
      SUM(CASE WHEN booking_date >= CURDATE() THEN 1 ELSE 0 END) AS upcoming_bookings
     FROM bookings`
  );

  return rows[0] || {};
}

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
  getBookingStats,
};