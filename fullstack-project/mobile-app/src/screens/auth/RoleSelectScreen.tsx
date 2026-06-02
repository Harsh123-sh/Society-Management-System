import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { colors, spacing } from '../../theme/tokens';
import { useAuth } from '../../contexts/AuthContext';

export default function RoleSelectScreen() {
  const { setRole } = useAuth();

  return (
    <Screen>
      <SectionTitle title="Society Mobile" subtitle="Choose the app role you want to open." />
      {(['resident', 'guard', 'admin'] as const).map((role) => (
        <Pressable key={role} onPress={() => setRole(role)} style={styles.roleButton}>
          <Text style={styles.roleTitle}>{role.toUpperCase()}</Text>
          <Text style={styles.roleCaption}>Open the {role} experience</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  roleButton: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  roleCaption: {
    color: colors.muted,
    marginTop: 6,
  },
});
