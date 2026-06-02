import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GuardHomeScreen from '../screens/guard/GuardHomeScreen';
import VisitorApprovalsScreen from '../screens/guard/VisitorApprovalsScreen';
import ScannerScreen from '../screens/guard/ScannerScreen';
import FaceCaptureScreen from '../screens/guard/FaceCaptureScreen';
import EmergencyScreen from '../screens/shared/EmergencyScreen';
import ChatScreen from '../screens/shared/ChatScreen';

const Tab = createBottomTabNavigator();

export default function GuardNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={GuardHomeScreen} />
      <Tab.Screen name="Approvals" component={VisitorApprovalsScreen} />
      <Tab.Screen name="Scan" component={ScannerScreen} />
      <Tab.Screen name="Face" component={FaceCaptureScreen} />
      <Tab.Screen name="SOS" component={EmergencyScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
    </Tab.Navigator>
  );
}
