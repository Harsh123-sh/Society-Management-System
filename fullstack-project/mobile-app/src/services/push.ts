import messaging from '@react-native-firebase/messaging';
import api from './api';

export async function requestPushPermission() {
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function registerFcmToken() {
  const granted = await requestPushPermission();
  if (!granted) {
    return null;
  }

  const token = await messaging().getToken();
  if (!token) {
    return null;
  }

  await api.post('/api/notifications/devices/register', {
    fcmToken: token,
    platform: 'android',
  });

  return token;
}

export function subscribeToPushEvents(onMessageReceived: (payload: unknown) => void) {
  const unsubscribeForeground = messaging().onMessage(async (message) => {
    onMessageReceived(message);
  });

  const unsubscribeOpened = messaging().onNotificationOpenedApp((message) => {
    onMessageReceived(message);
  });

  messaging()
    .getInitialNotification()
    .then((message) => {
      if (message) {
        onMessageReceived(message);
      }
    })
    .catch(() => undefined);

  return () => {
    unsubscribeForeground();
    unsubscribeOpened();
  };
}
