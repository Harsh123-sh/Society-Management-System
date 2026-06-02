import {
  registerDeviceToken,
  registerWebSubscription,
} from "./notificationApi";

const PUSH_SW_FILE = "/push-sw.js";
const FIREBASE_APP_CDN = "https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js";
const FIREBASE_MESSAGING_CDN = "https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function setupWebPushSubscription(registration) {
  const vapidPublicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;
  if (!vapidPublicKey || !("PushManager" in window)) {
    return;
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  await registerWebSubscription(subscription.toJSON());
}

async function setupFcmWebToken(registration) {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;

  if (!apiKey || !projectId || !messagingSenderId || !appId || !vapidKey) {
    return;
  }

  try {
    await Promise.all([
      loadScript(FIREBASE_APP_CDN),
      loadScript(FIREBASE_MESSAGING_CDN),
    ]);

    const firebaseGlobal = window.firebase;
    if (!firebaseGlobal) {
      return;
    }

    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      messagingSenderId,
      appId,
    };

    const alreadyInitialized = Array.isArray(firebaseGlobal.apps) && firebaseGlobal.apps.length > 0;
    const app = alreadyInitialized ? firebaseGlobal.app() : firebaseGlobal.initializeApp(firebaseConfig);

    if (registration?.active) {
      registration.active.postMessage({
        type: "INIT_FIREBASE",
        config: firebaseConfig,
      });
    }

    const messaging = firebaseGlobal.messaging(app);
    const token = await messaging.getToken({
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await registerDeviceToken({
        fcmToken: token,
        platform: "web",
        deviceId: navigator.userAgent.slice(0, 100),
      });
    }
  } catch (_error) {
    // FCM setup is optional in local/dev environments.
  }
}

export async function initializeWebPushNotifications() {
  if (!localStorage.getItem("token")) {
    return;
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return;
  }

  const registration = await navigator.serviceWorker.register(PUSH_SW_FILE);

  await Promise.allSettled([
    setupWebPushSubscription(registration),
    setupFcmWebToken(registration),
  ]);
}
