import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import ResidentNavigator from './ResidentNavigator';
import GuardNavigator from './GuardNavigator';
import AdminNavigator from './AdminNavigator';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme/tokens';

export default function RootNavigator() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator />;
  }

  if (user.role === 'resident') {
    return <ResidentNavigator />;
  }

  if (user.role === 'guard') {
    return <GuardNavigator />;
  }

  return <AdminNavigator />;
}
