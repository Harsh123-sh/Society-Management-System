const bookingModel = require("../models/bookingModel");
const userModel = require("../models/userModel");
const notificationModel = require("../models/notificationModel");

async function createBooking(req, res) {
  try {
    const {
      resourceType,
      resourceId,
      bookingDate,
      startTime,
      endTime,
      purpose,
      numberOfGuests,
    } = req.body;

    if (!resourceType || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "resourceType, bookingDate, startTime and endTime are required",
      });
    }

    const user = await userModel.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const bookingId = await bookingModel.createBooking({
      resourceType,
      resourceId: resourceId || null,
      bookedBy: req.user.id,
      bookingDate,
      startTime,
      endTime,
      purpose,
      numberOfGuests,
      status: user.role === "admin" ? "approved" : "pending",
    });

    const booking = await bookingModel.getBookingById(bookingId);
    await notificationModel.createNotification({
      targetRole: "admin",
      title: "New booking request",
      message: `${user.name} created a booking for ${resourceType} on ${bookingDate}`,
      priority: "medium",
      category: "event_reminder",
      deepLink: `/bookings/${bookingId}`,
      relatedType: "booking",
      relatedId: bookingId,
    });
    res.status(201).json({ success: true, message: "Booking created", data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create booking" });
  }
}

async function getBookings(req, res) {
  try {
    const { status, resourceType } = req.query;
    const bookings = await bookingModel.getBookings({
      status: status || undefined,
      resourceType: resourceType || undefined,
      bookedBy: req.user.role === "resident" ? req.user.id : undefined,
    });

    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
}

async function getBooking(req, res) {
  try {
    const booking = await bookingModel.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch booking" });
  }
}

async function updateBooking(req, res) {
  try {
    const updated = await bookingModel.updateBooking(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = await bookingModel.getBookingById(req.params.id);
    res.json({ success: true, message: "Booking updated", data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update booking" });
  }
}

async function approveBooking(req, res) {
  try {
    const updated = await bookingModel.updateBookingStatus(req.params.id, "approved", req.user.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    const booking = await bookingModel.getBookingById(req.params.id);
    await notificationModel.createNotification({
      targetUserId: booking.booked_by,
      targetRole: "all",
      title: "Booking approved",
      message: `Your booking for ${booking.resource_type} on ${booking.booking_date} was approved.`,
      priority: "high",
      category: "event_reminder",
      deepLink: `/bookings/${booking.id}`,
      relatedType: "booking",
      relatedId: booking.id,
    });
    res.json({ success: true, message: "Booking approved", data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to approve booking" });
  }
}

async function rejectBooking(req, res) {
  try {
    const updated = await bookingModel.updateBookingStatus(req.params.id, "rejected", req.user.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    const booking = await bookingModel.getBookingById(req.params.id);
    await notificationModel.createNotification({
      targetUserId: booking.booked_by,
      targetRole: "all",
      title: "Booking rejected",
      message: `Your booking for ${booking.resource_type} on ${booking.booking_date} was rejected.`,
      priority: "high",
      category: "event_reminder",
      deepLink: `/bookings/${booking.id}`,
      relatedType: "booking",
      relatedId: booking.id,
    });
    res.json({ success: true, message: "Booking rejected", data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reject booking" });
  }
}

async function cancelBooking(req, res) {
  try {
    const updated = await bookingModel.updateBookingStatus(req.params.id, "cancelled", null);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    const booking = await bookingModel.getBookingById(req.params.id);
    await notificationModel.createNotification({
      targetUserId: booking.booked_by,
      targetRole: "all",
      title: "Booking cancelled",
      message: `Your booking for ${booking.resource_type} on ${booking.booking_date} has been cancelled.`,
      priority: "medium",
      category: "event_reminder",
      deepLink: `/bookings/${booking.id}`,
      relatedType: "booking",
      relatedId: booking.id,
    });
    res.json({ success: true, message: "Booking cancelled", data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to cancel booking" });
  }
}

async function deleteBooking(req, res) {
  try {
    const deleted = await bookingModel.deleteBooking(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, message: "Booking deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete booking" });
  }
}

async function getStats(req, res) {
  try {
    const stats = await bookingModel.getBookingStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch booking stats" });
  }
}

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
  deleteBooking,
  getStats,
};