import React from 'react';
import { ScrollView, Text } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { FeatureCard } from '../../components/FeatureCard';
import { useNotifications } from '../../contexts/NotificationContext';

export default function NotificationsScreen() {
  const { notifications } = useNotifications();

  return (
    <Screen>
      <SectionTitle title="Notifications" subtitle="Visitor, payment, chat, emergency, event, and AI alerts." />
      <ScrollView>
        {notifications.map((item) => (
          <FeatureCard key={String(item.id)} title={item.title} subtitle={item.message} />
        ))}
        {!notifications.length ? <Text>No notifications yet.</Text> : null}
      </ScrollView>
    </Screen>
  );
}
  