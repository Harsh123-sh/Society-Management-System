import React from 'react';
import { ScrollView } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { FeatureCard } from '../../components/FeatureCard';

export default function ChatScreen() {
  return (
    <Screen>
      <SectionTitle title="Chat" subtitle="Socket-driven threads and message updates." />
      <ScrollView>
        <FeatureCard title="Direct messages" subtitle="Resident-to-resident and resident-to-guard threads." />
        <FeatureCard title="Group updates" subtitle="Society-wide and building-level channels." />
      </ScrollView>
    </Screen>
  );
}
