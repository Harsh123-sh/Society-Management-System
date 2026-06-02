const notificationModel = require("../models/notificationModel");

const PUSH_CATEGORIES = new Set([
  "visitor_alert",
  "payment_reminder",
  "chat_message",
  "emergency_alert",
  "event_reminder",
  "ai_alert",
  "general",
]);

function normalizeCategory(category) {
  const value = String(category || "general").trim().toLowerCase();
  return PUSH_CATEGORIES.has(value) ? value : "general";
}

async function getNotifications(req, res) {
  try {
    const notifications = await notificationModel.getNotifications({
      targetUserId: req.user.id,
      targetRole: req.user.role,
      isRead: req.query.isRead !== undefined ? req.query.isRead === "true" : undefined,
      category: req.query.category,
    });

    res.json({ success: true, data: notifications, count: notifications.length });
  } catch (_error) {
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
}

async function createNotification(req, res) {
  try {
    const { targetRole, targetUserId, title, message, priority, relatedType, relatedId, category, deepLink } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "title and message are required" });
    }

    const notificationId = await notificationModel.createNotification({
      targetRole,
      targetUserId,
      title,
      message,
      priority,
      relatedType,
      relatedId,
      category,
      deepLink,
      dispatchPush: true,
    });

    res.status(201).json({ success: true, message: "Notification created", data: { id: notificationId } });
  } catch (_error) {
    res.status(500).json({ success: false, message: "Failed to create notification" });
  }
}

async function markAsRead(req, res) {
  try {
    const updated = await notificationModel.markNotificationAsRead(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true, message: "Notification marked as read" });
  } catch (_error) {
    res.status(500).json({ success: false, message: "Failed to update notification" });
  }
}

async function registerDeviceToken(req, res) {
  try {
    const { fcmToken, platform = "web", deviceId = null, appVersion = null } = req.body || {};
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: "fcmToken is required" });
    }

    await notificationModel.registerDeviceToken({
      userId: req.user.id,
      platform,
      fcmToken,
      deviceId,
      appVersion,
    });

    return res.status(201).json({ success: true, message: "Device token registered" });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to register device token" });
  }
}

async function unregisterDeviceToken(req, res) {
  try {
    const token = String(req.params.token || req.body?.fcmToken || "").trim();
    if (!token) {
      return res.status(400).json({ success: false, message: "fcm token is required" });
    }

    await notificationModel.unregisterDeviceToken({ userId: req.user.id, fcmToken: token });
    return res.json({ success: true, message: "Device token unregistered" });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to unregister device token" });
  }
}

async function registerWebSubscription(req, res) {
  try {
    const { subscription } = req.body || {};
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ success: false, message: "Valid web push subscription is required" });
    }

    await notificationModel.registerWebSubscription({
      userId: req.user.id,
      subscription,
      userAgent: req.headers["user-agent"] || null,
    });

    return res.status(201).json({ success: true, message: "Web push subscription registered" });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to register web subscription" });
  }
}

async function unregisterWebSubscription(req, res) {
  try {
    const endpoint = String(req.body?.endpoint || "").trim();
    if (!endpoint) {
      return res.status(400).json({ success: false, message: "subscription endpoint is required" });
    }

    await notificationModel.unregisterWebSubscription({ userId: req.user.id, endpoint });
    return res.json({ success: true, message: "Web push subscription removed" });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to remove web subscription" });
  }
}

async function sendPushAlert(req, res) {
  try {
    const {
      targetRole = "all",
      targetUserId = null,
      title,
      message,
      priority = "medium",
      category = "general",
      relatedType = null,
      relatedId = null,
      deepLink = null,
    } = req.body || {};

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "title and message are required" });
    }

    const normalizedCategory = normalizeCategory(category);

    const id = await notificationModel.createNotification({
      targetRole,
      targetUserId,
      title,
      message,
      priority,
      category: normalizedCategory,
      relatedType,
      relatedId,
      deepLink,
      dispatchPush: true,
    });

    return res.status(201).json({
      success: true,
      message: "Push notification sent",
      data: { id, category: normalizedCategory },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to send push notification" });
  }
}

async function createEventReminder(req, res) {
  try {
    const {
      title,
      message,
      eventAt,
      remindBeforeMinutes = 30,
      targetRole = "all",
      targetUserId = null,
    } = req.body || {};

    if (!title || !message || !eventAt) {
      return res.status(400).json({ success: false, message: "title, message and eventAt are required" });
    }

    const id = await notificationModel.createEventReminder({
      title,
      message,
      targetRole,
      targetUserId,
      eventAt,
      remindBeforeMinutes,
      createdBy: req.user.id,
    });

    return res.status(201).json({ success: true, message: "Event reminder created", data: { id } });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to create event reminder" });
  }
}

async function dispatchEventReminders(req, res) {
  try {
    const dueEvents = await notificationModel.getDueEventReminders(Number(req.body?.limit || 200));
    let dispatched = 0;

    for (const event of dueEvents) {
      await notificationModel.createNotification({
        targetRole: event.target_role,
        targetUserId: event.target_user_id,
        title: event.title,
        message: event.message,
        priority: "high",
        category: "event_reminder",
        relatedType: "notification_event",
        relatedId: event.id,
        dispatchPush: true,
      });

      await notificationModel.markEventReminderDispatched(event.id);
      dispatched += 1;
    }

    return res.json({
      success: true,
      message: "Event reminder dispatch completed",
      data: {
        queued: dueEvents.length,
        dispatched,
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to dispatch event reminders" });
  }
}

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  registerDeviceToken,
  unregisterDeviceToken,
  registerWebSubscription,
  unregisterWebSubscription,
  sendPushAlert,
  createEventReminder,
  dispatchEventReminders,
};
