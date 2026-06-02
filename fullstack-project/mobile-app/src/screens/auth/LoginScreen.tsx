import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { colors, spacing } from '../../theme/tokens';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen>
      <SectionTitle title="Sign in" subtitle="Authenticate with the existing backend API." />
      <View style={styles.form}>
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} />
        <Pressable onPress={() => signIn(email, password)} style={styles.button}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
