import React from 'react';
import { ScrollView } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { FeatureCard } from '../../components/FeatureCard';

export default function GuardHomeScreen() {
  return (
    <Screen>
      <SectionTitle title="Guard Console" subtitle="Scan, verify, approve, and trigger SOS quickly." />
      <ScrollView>
        <FeatureCard title="QR scanner" subtitle="Scan visitor passes at the gate." />
        <FeatureCard title="Face capture" subtitle="Match visitor identity against the stored image." />
        <FeatureCard title="Approvals" subtitle="Review owner approvals and gate entries." />
        <FeatureCard title="Emergency SOS" subtitle="Trigger critical alerts for the control room." />
      </ScrollView>
    </Screen>
  );
}
