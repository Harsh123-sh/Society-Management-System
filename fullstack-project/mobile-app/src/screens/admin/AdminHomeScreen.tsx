import React from 'react';
import { ScrollView } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { FeatureCard } from '../../components/FeatureCard';

export default function AdminHomeScreen() {
  return (
    <Screen>
      <SectionTitle title="Admin Control Center" subtitle="Govern visitors, billing, chat, alerts, and AI output." />
      <ScrollView>
        <FeatureCard title="Realtime dashboard" subtitle="Monitor visitor, payment, and emergency activity." />
        <FeatureCard title="Push notifications" subtitle="Broadcast app and emergency alerts to every role." />
        <FeatureCard title="AI tools" subtitle="Generate notices, summaries, and response suggestions." />
      </ScrollView>
    </Screen>
  );
}
