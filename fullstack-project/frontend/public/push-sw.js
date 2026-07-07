importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js");

let firebaseConfigured = false;

function initFirebase(config) {
  if (firebaseConfigured || !config) {
    return;
  }

  if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) {
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const notificationTitle = payload?.notification?.title || payload?.data?.title || "Society update";
      const notificationOptions = {
        body: payload?.notification?.body || payload?.data?.body || "You have a new notification",
        icon: "/nexora-favicon.png",
        badge: "/nexora-favicon.png",
        data: payload?.data || {},
        tag: payload?.data?.category || "society-notification",
        renotify: true,
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

    firebaseConfigured = true;
  } catch (_error) {
    // Firebase setup is best-effort and should not block plain web push notifications.
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "INIT_FIREBASE") {
    initFirebase(event.data.config);
  }
});

self.addEventListener("push", (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (_error) {
      payload = { title: "Society update", body: event.data.text() };
    }
  }

  const title = payload.title || "Society update";
  const options = {
    body: payload.body || payload.message || "You have a new notification",
    icon: "/nexora-favicon.png",
    badge: "/nexora-favicon.png",
    data: payload.data || {},
    tag: payload.tag || payload.data?.category || "society-notification",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.deepLink || "/notifications";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(Promise.resolve());
});
