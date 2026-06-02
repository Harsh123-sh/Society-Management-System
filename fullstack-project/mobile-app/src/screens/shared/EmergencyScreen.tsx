import React from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { colors, spacing } from '../../theme/tokens';
import { sendEmergencyAlert } from '../../services/notificationBridge';

export default function EmergencyScreen() {
  const trigger = async () => {
    await sendEmergencyAlert({ message: 'Emergency SOS from mobile app', location: 'Unknown' });
    Alert.alert('SOS sent', 'Security and admin teams were notified.');
  };

  return (
    <Screen>
      <SectionTitle title="Emergency SOS" subtitle="One-tap critical alert for guards and admins." />
      <Pressable onPress={trigger} style={styles.button}>
        <Text style={styles.text}>Trigger SOS</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.danger,
    padding: spacing.lg,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  text: {
    color: '#fff',
    fontWeight: '800',
  },
});
