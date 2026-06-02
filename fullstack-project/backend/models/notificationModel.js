const db = require("../db");
const { sendFcmMulticast, sendWebPushNotifications } = require("../services/pushNotificationService");

const VALID_CATEGORIES = new Set([
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
  return VALID_CATEGORIES.has(value) ? value : "general";
}

async function getTargetUserIds({ targetRole = "all", targetUserId = null }) {
  if (targetUserId) {
    return [Number(targetUserId)];
  }

  if (!targetRole || targetRole === "all") {
    const [rows] = await db.query("SELECT id FROM users WHERE is_active = 1");
    return rows.map((row) => Number(row.id));
  }

  const [rows] = await db.query(
    "SELECT id FROM users WHERE role = ? AND is_active = 1",
    [targetRole]
  );

  return rows.map((row) => Number(row.id));
}

async function getActiveDeviceTokensByUserIds(userIds) {
  if (!Array.isArray(userIds) || !userIds.length) {
    return [];
  }

  const [rows] = await db.query(
    `SELECT id, user_id, platform, fcm_token
     FROM notification_device_tokens
     WHERE user_id IN (?) AND is_active = 1`,
    [userIds]
  );

  return rows;
}

async function getActiveWebSubscriptionsByUserIds(userIds) {
  if (!Array.isArray(userIds) || !userIds.length) {
    return [];
  }

  const [rows] = await db.query(
    `SELECT id, user_id, endpoint, p256dh, auth
     FROM notification_web_subscriptions
     WHERE user_id IN (?) AND is_active = 1`,
    [userIds]
  );

  return rows;
}

async function deactivateDeviceTokens(tokens = []) {
  if (!tokens.length) {
    return;
  }

  await db.query(
    `UPDATE notification_device_tokens
     SET is_active = 0
     WHERE fcm_token IN (?)`,
    [tokens]
  );
}

async function deactivateWebSubscriptions(endpoints = []) {
  if (!endpoints.length) {
    return;
  }

  await db.query(
    `UPDATE notification_web_subscriptions
     SET is_active = 0
     WHERE endpoint IN (?)`,
    [endpoints]
  );
}

async function dispatchPushNotification(payload) {
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
  } = payload;

  if (!title || !message) {
    return { sent: false, reason: "missing_title_or_message" };
  }

  const userIds = await getTargetUserIds({ targetRole, targetUserId });
  if (!userIds.length) {
    return { sent: false, reason: "no_target_users" };
  }

  const [tokens, webSubscriptions] = await Promise.all([
    getActiveDeviceTokensByUserIds(userIds),
    getActiveWebSubscriptionsByUserIds(userIds),
  ]);

  const tokenValues = tokens.map((item) => item.fcm_token);
  const fcmResult = await sendFcmMulticast({
    tokens: tokenValues,
    notification: {
      title,
      body: message,
    },
    data: {
      category: normalizeCategory(category),
      priority,
      relatedType: relatedType || "",
      relatedId: relatedId || "",
      deepLink: deepLink || "",
    },
  });

  if (fcmResult.invalidTokens?.length) {
    await deactivateDeviceTokens(fcmResult.invalidTokens);
  }

  const webResult = await sendWebPushNotifications({
    subscriptions: webSubscriptions,
    payload: {
      title,
      body: message,
      data: {
        category: normalizeCategory(category),
        priority,
        relatedType,
        relatedId,
        deepLink,
      },
    },
  });

  if (webResult.invalidEndpoints?.length) {
    await deactivateWebSubscriptions(webResult.invalidEndpoints);
  }

  return {
    sent: true,
    userCount: userIds.length,
    fcm: fcmResult,
    webPush: webResult,
  };
}

async function createNotification(payload) {
  const {
    targetRole,
    targetUserId,
    title,
    message,
    priority,
    relatedType,
    relatedId,
    category,
    deepLink,
    dispatchPush = true,
  } = payload;

  const normalizedCategory = normalizeCategory(category);

  const [result] = await db.query(
    `INSERT INTO notifications (
      target_role, target_user_id, title, message, priority, category, deep_link,
      related_type, related_id, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      targetRole || "all",
      targetUserId || null,
      title,
      message,
      priority || "medium",
      normalizedCategory,
      deepLink || null,
      relatedType || null,
      relatedId || null,
    ]
  );

  if (dispatchPush) {
    try {
      await dispatchPushNotification({
        targetRole,
        targetUserId,
        title,
        message,
        priority,
        category: normalizedCategory,
        relatedType,
        relatedId,
        deepLink,
      });
    } catch (_error) {
      // in-app notification write should not fail when push delivery fails
    }
  }

  return result.insertId;
}

async function getNotifications(filters = {}) {
  let query = `SELECT n.*, u.name AS target_user_name FROM notifications n LEFT JOIN users u ON u.id = n.target_user_id WHERE 1=1`;
  const params = [];

  if (filters.targetUserId) {
    query += " AND (n.target_user_id = ? OR n.target_role = 'all')";
    params.push(filters.targetUserId);
  }

  if (filters.targetRole) {
    query += " AND (n.target_role = ? OR n.target_role = 'all')";
    params.push(filters.targetRole);
  }

  if (filters.isRead !== undefined) {
    query += " AND n.is_read = ?";
    params.push(filters.isRead ? 1 : 0);
  }

  if (filters.category) {
    query += " AND n.category = ?";
    params.push(normalizeCategory(filters.category));
  }

  query += " ORDER BY n.created_at DESC";

  const [rows] = await db.query(query, params);
  return rows;
}

async function markNotificationAsRead(notificationId) {
  const [result] = await db.query(
    `UPDATE notifications SET is_read = 1 WHERE id = ?`,
    [notificationId]
  );
  return result.affectedRows > 0;
}

async function registerDeviceToken({ userId, platform = "web", fcmToken, deviceId = null, appVersion = null }) {
  const [result] = await db.query(
    `INSERT INTO notification_device_tokens (user_id, platform, fcm_token, device_id, app_version, is_active, last_seen_at)
     VALUES (?, ?, ?, ?, ?, 1, NOW())
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       platform = VALUES(platform),
       device_id = VALUES(device_id),
       app_version = VALUES(app_version),
       is_active = 1,
       last_seen_at = NOW()`,
    [userId, platform, fcmToken, deviceId, appVersion]
  );

  return result.affectedRows > 0;
}

async function unregisterDeviceToken({ userId, fcmToken }) {
  const [result] = await db.query(
    `UPDATE notification_device_tokens
     SET is_active = 0
     WHERE user_id = ? AND fcm_token = ?`,
    [userId, fcmToken]
  );

  return result.affectedRows > 0;
}

async function registerWebSubscription({ userId, subscription, userAgent = null }) {
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  const expirationTime = subscription?.expirationTime || null;

  if (!endpoint || !p256dh || !auth) {
    return false;
  }

  const [result] = await db.query(
    `INSERT INTO notification_web_subscriptions
      (user_id, endpoint, p256dh, auth, expiration_time, user_agent, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      p256dh = VALUES(p256dh),
      auth = VALUES(auth),
      expiration_time = VALUES(expiration_time),
      user_agent = VALUES(user_agent),
      is_active = 1`,
    [
      userId,
      endpoint,
      p256dh,
      auth,
      expirationTime ? new Date(expirationTime) : null,
      userAgent,
    ]
  );

  return result.affectedRows > 0;
}

async function unregisterWebSubscription({ userId, endpoint }) {
  const [result] = await db.query(
    `UPDATE notification_web_subscriptions
     SET is_active = 0
     WHERE user_id = ? AND endpoint = ?`,
    [userId, endpoint]
  );

  return result.affectedRows > 0;
}

async function createEventReminder({ title, message, targetRole = "all", targetUserId = null, eventAt, remindBeforeMinutes = 30, createdBy = null }) {
  const [result] = await db.query(
    `INSERT INTO notification_events
      (title, message, target_role, target_user_id, category, event_at, remind_before_minutes, created_by)
     VALUES (?, ?, ?, ?, 'event_reminder', ?, ?, ?)`,
    [title, message, targetRole, targetUserId, eventAt, Number(remindBeforeMinutes || 30), createdBy]
  );

  return result.insertId;
}

async function getDueEventReminders(limit = 200) {
  const [rows] = await db.query(
    `SELECT *
     FROM notification_events
     WHERE dispatched_at IS NULL
       AND DATE_SUB(event_at, INTERVAL remind_before_minutes MINUTE) <= NOW()
     ORDER BY event_at ASC
     LIMIT ?`,
    [Number(limit || 200)]
  );

  return rows;
}

async function markEventReminderDispatched(eventId) {
  const [result] = await db.query(
    `UPDATE notification_events SET dispatched_at = NOW() WHERE id = ?`,
    [eventId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  registerDeviceToken,
  unregisterDeviceToken,
  registerWebSubscription,
  unregisterWebSubscription,
  dispatchPushNotification,
  createEventReminder,
  getDueEventReminders,
  markEventReminderDispatched,
};
