import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ResidentHomeScreen from '../screens/resident/ResidentHomeScreen';
import ResidentVisitorsScreen from '../screens/resident/ResidentVisitorsScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import PaymentsScreen from '../screens/shared/PaymentsScreen';
import AssistantScreen from '../screens/shared/AssistantScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';

const Tab = createBottomTabNavigator();

export default function ResidentNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={ResidentHomeScreen} />
      <Tab.Screen name="Visitors" component={ResidentVisitorsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="AI" component={AssistantScreen} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} />
    </Tab.Navigator>
  );
}
