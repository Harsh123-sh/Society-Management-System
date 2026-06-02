import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import type { AppNotification } from '../types/models';
import { fetchNotifications } from '../services/api';
import { subscribeToPushEvents } from '../services/push';

type NotificationState = {
  notifications: AppNotification[];
  refreshNotifications: () => Promise<void>;
  pushLocalNotification: (notification: AppNotification) => void;
};

const NotificationContext = createContext<NotificationState | undefined>(undefined);

export function NotificationProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refreshNotifications = async () => {
    const response = await fetchNotifications();
    setNotifications(response.data || []);
  };

  useEffect(() => {
    refreshNotifications().catch(() => undefined);
    const unsubscribe = subscribeToPushEvents(() => {
      refreshNotifications().catch(() => undefined);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<NotificationState>(() => ({
    notifications,
    refreshNotifications,
    pushLocalNotification(notification) {
      setNotifications((current) => [notification, ...current]);
    },
  }), [notifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
