import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import PaymentsScreen from '../screens/shared/PaymentsScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import AssistantScreen from '../screens/shared/AssistantScreen';
import EmergencyScreen from '../screens/shared/EmergencyScreen';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={AdminHomeScreen} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="AI" component={AssistantScreen} />
      <Tab.Screen name="SOS" component={EmergencyScreen} />
    </Tab.Navigator>
  );
}
