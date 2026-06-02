import React from 'react';
import { ScrollView } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { FeatureCard } from '../../components/FeatureCard';

export default function PaymentsScreen() {
  return (
    <Screen>
      <SectionTitle title="Payments" subtitle="Maintenance dues, reminders, and payment verification." />
      <ScrollView>
        <FeatureCard title="Bill list" subtitle="Open maintenance and fee invoices." />
        <FeatureCard title="Reminders" subtitle="Push reminders for due and overdue bills." />
        <FeatureCard title="Payment proof" subtitle="Capture UPI or gateway confirmations." />
      </ScrollView>
    </Screen>
  );
}
