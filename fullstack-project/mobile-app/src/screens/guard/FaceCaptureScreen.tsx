import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { colors } from '../../theme/tokens';

export default function FaceCaptureScreen() {
  return (
    <Screen>
      <SectionTitle title="Face capture" subtitle="Hook this screen to react-native-vision-camera and liveness detection." />
      <View style={styles.placeholder}>
        <Text style={styles.text}>Camera preview, face frame, and capture controls go here.</Text>
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
    padding: 24,
  },
  text: {
    color: colors.muted,
    textAlign: 'center',
  },
});
