import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { FeatureCard } from '../../components/FeatureCard';
import { colors } from '../../theme/tokens';

export default function ResidentHomeScreen() {
  return (
    <Screen>
      <SectionTitle title="Resident Home" subtitle="Visitors, chat, bills, AI, and alerts in one place." />
      <ScrollView showsVerticalScrollIndicator={false}>
        <FeatureCard title="Visitor approvals" subtitle="Approve visitors and receive gate alerts." />
        <FeatureCard title="Payments" subtitle="Open invoices, reminders, and receipts." />
        <FeatureCard title="AI assistant" subtitle="Ask about bills, notices, and society actions." />
        <FeatureCard title="Notifications" subtitle="Track emergency alerts and event reminders." />
      </ScrollView>
    </Screen>
  );
}
