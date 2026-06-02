# Notification Setup

## Backend

Install the server dependencies:

- `firebase-admin`
- `web-push`

Required environment variables:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
GOOGLE_APPLICATION_CREDENTIALS=
WEB_PUSH_PUBLIC_KEY=
WEB_PUSH_PRIVATE_KEY=
WEB_PUSH_CONTACT=mailto:admin@example.com
```

`FIREBASE_PRIVATE_KEY` should preserve newline characters as `\n`.

## Web Client

Install the client dependency:

- `firebase`

Required environment variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_WEB_PUSH_PUBLIC_KEY=
```

The web app registers `public/push-sw.js` and then stores both:

- an FCM token for Firebase Cloud Messaging
- a Web Push subscription for browser push fallback

## Mobile Apps

For Android and iOS, use the same backend APIs:

- `POST /api/notifications/devices/register`
- `DELETE /api/notifications/devices/:token`

Store the user session token in the mobile app and register the FCM token after login.

### Android

- Add Firebase to the Android app
- Place `google-services.json` in the Android project
- Request notification permission on Android 13+
- Register the FCM token with the backend after login

### iOS

- Add Firebase to the iOS app
- Enable push notification capabilities in Xcode
- Request APNs permissions
- Register the FCM token with the backend after login

## Notification Categories

Supported categories:

- `visitor_alert`
- `payment_reminder`
- `chat_message`
- `emergency_alert`
- `event_reminder`
- `ai_alert`
- `general`

## Backend Routes

- `GET /api/notifications`
- `POST /api/notifications`
- `PATCH /api/notifications/:id/read`
- `POST /api/notifications/devices/register`
- `DELETE /api/notifications/devices/:token`
- `POST /api/notifications/web-subscriptions`
- `DELETE /api/notifications/web-subscriptions`
- `POST /api/notifications/push/send`
- `POST /api/notifications/events`
- `POST /api/notifications/events/dispatch`
