import React from 'react';
import { ScrollView } from 'react-native';
import { Screen, SectionTitle } from '../../components/Screen';
import { FeatureCard } from '../../components/FeatureCard';

export default function VisitorApprovalsScreen() {
  return (
    <Screen>
      <SectionTitle title="Visitor approvals" subtitle="Approve, reject, and inspect visitor requests." />
      <ScrollView>
        <FeatureCard title="Pending approvals" subtitle="List owner approvals awaiting gate action." />
        <FeatureCard title="Approved entries" subtitle="Track expected arrival windows and visitor checks." />
      </ScrollView>
    </Screen>
  );
}
