import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { colors } from '../../theme/tokens';

export default function ScannerScreen() {
  return (
    <Screen>
      <SectionTitle title="QR Scanner" subtitle="Hook this screen to react-native-vision-camera or a QR scanner component." />
      <View style={styles.placeholder}>
        <Text style={styles.text}>Camera preview and QR overlay go here.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.muted,
  },
});
