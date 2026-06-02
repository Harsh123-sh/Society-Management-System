let webPush = null;

let firebaseMessaging = null;
let firebaseInitAttempted = false;
let webPushConfigured = false;

function getFirebaseMessaging() {
  if (firebaseInitAttempted) {
    return firebaseMessaging;
  }

  firebaseInitAttempted = true;

  try {
    const admin = require("firebase-admin");
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : null;

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
      }
    }

    firebaseMessaging = admin.apps.length ? admin.messaging() : null;
  } catch (_error) {
    firebaseMessaging = null;
  }

  return firebaseMessaging;
}

function configureWebPush() {
  if (webPushConfigured) {
    return true;
  }

  if (!webPush) {
    try {
      webPush = require("web-push");
    } catch (_error) {
      return false;
    }
  }

  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const contact = process.env.WEB_PUSH_CONTACT || "mailto:admin@society.local";

  if (!publicKey || !privateKey) {
    return false;
  }

  try {
    webPush.setVapidDetails(contact, publicKey, privateKey);
    webPushConfigured = true;
    return true;
  } catch (_error) {
    return false;
  }
}

async function sendFcmMulticast({ tokens = [], notification, data = {} }) {
  const messaging = getFirebaseMessaging();
  if (!messaging || !Array.isArray(tokens) || !tokens.length) {
    return { successCount: 0, failureCount: tokens.length || 0, invalidTokens: [] };
  }

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification,
    data: Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[String(key)] = String(value);
      }
      return acc;
    }, {}),
    android: {
      priority: "high",
      notification: { channelId: "society-alerts" },
    },
    apns: {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default" } },
    },
    webpush: {
      headers: { Urgency: "high" },
    },
  });

  const invalidTokens = [];
  response.responses.forEach((item, index) => {
    if (!item.success) {
      const code = item.error?.code || "";
      if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
        invalidTokens.push(tokens[index]);
      }
    }
  });

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokens,
  };
}

async function sendWebPushNotifications({ subscriptions = [], payload }) {
  const isConfigured = configureWebPush();
  if (!isConfigured || !subscriptions.length) {
    return { successCount: 0, failureCount: subscriptions.length || 0, invalidEndpoints: [] };
  }

  let successCount = 0;
  let failureCount = 0;
  const invalidEndpoints = [];

  for (const sub of subscriptions) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webPush.sendNotification(subscription, JSON.stringify(payload));
      successCount += 1;
    } catch (error) {
      failureCount += 1;
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        invalidEndpoints.push(sub.endpoint);
      }
    }
  }

  return {
    successCount,
    failureCount,
    invalidEndpoints,
  };
}

module.exports = {
  sendFcmMulticast,
  sendWebPushNotifications,
};
