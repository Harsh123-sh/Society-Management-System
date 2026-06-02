import React from 'react';
import { ScrollView } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { FeatureCard } from '../../components/FeatureCard';

export default function AssistantScreen() {
  return (
    <Screen>
      <SectionTitle title="AI Assistant" subtitle="Ask for summaries, notices, and actions." />
      <ScrollView>
        <FeatureCard title="Notice generation" subtitle="Generate society notices from prompts." />
        <FeatureCard title="Analytics" subtitle="Summarize patterns across visitors and billing." />
        <FeatureCard title="Recommendations" subtitle="Suggest next best actions for staff and admins." />
      </ScrollView>
    </Screen>
  );
}
