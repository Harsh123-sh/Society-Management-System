import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './navigation/RootNavigator';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { connectSocket, disconnectSocket } from './services/realtime';
import { registerFcmToken } from './services/push';

function Bootstrap() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.token) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(user.token);
    registerFcmToken().catch(() => undefined);

    socket.on('connect_error', () => undefined);

    return () => {
      disconnectSocket();
    };
  }, [user?.token]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AuthProvider>
          <NotificationProvider>
            <Bootstrap />
          </NotificationProvider>
        </AuthProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
