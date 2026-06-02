import React from 'react';
import { ScrollView } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { FeatureCard } from '../../components/FeatureCard';

export default function ResidentVisitorsScreen() {
  return (
    <Screen>
      <SectionTitle title="Visitors" subtitle="Create approvals and review incoming visitor requests." />
      <ScrollView>
        <FeatureCard title="Create approval" subtitle="Pre-approve visitors for your flat." />
        <FeatureCard title="Track gate status" subtitle="See when a visitor has arrived or been blocked." />
      </ScrollView>
    </Screen>
  );
}
