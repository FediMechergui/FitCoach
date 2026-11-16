import React, { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { REPORT_SECTIONS, buildReportHtml, reportPreviewSections, type ReportSection } from '@/lib/reportHtml';
import { buildReportData, type ReportData } from '@/repositories/reportRepo';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Row, SectionHeader } from '@/components/ui/misc';
import { PageHero } from '@/components/ui/PageHero';
import { exportReport } from '@/services/pdfReport';
import { recordReport } from '@/repositories/eventsRepo';

export function ReportsScreen() {
  const theme = useTheme();
  const [busy, setBusy] = useState<'nutritionist' | 'coach' | null>(null);
  const [snapshot, setSnapshot] = useState<ReportData | null>(null);
  const [included, setIncluded] = useState<ReportSection[]>(['Nutrition', 'Training & Activity', 'Sleep']);
  const preview = snapshot ? reportPreviewSections(buildReportHtml(snapshot, included)) : [];

  const generate = async (audience: 'nutritionist' | 'coach') => {
    try {
      setBusy(audience);
      await exportReport(audience, included, snapshot ?? undefined);
      recordReport(audience);
    } catch (e) {
      Alert.alert('Could not generate report', String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <PageHero icon="report.pdf" color={theme.colors.danger} title="Reports" subtitle="Generate a shareable PDF from your data, tailored for the professional you're working with. It opens the share sheet so you can send or save it." />

      <SectionHeader title="For a Nutritionist" />
      <Card style={{ gap: 10 }} accent={theme.colors.accent}>
        <Row gap={10} style={{ alignItems: 'center' }}>
          <Icon icon="report.nutritionist" size={22} color={theme.colors.accent} />
          <Text variant="h3" style={{ flex: 1 }}>Nutrition & body report</Text>
        </Row>
        <Text variant="caption" color="textMuted">
          Calorie & macro targets vs. actual intake (7d/30d), body composition & weight trend,
          hydration, caffeine, alcohol, sleep, and any declared health conditions.
        </Text>
        <Button
          title="Review nutritionist report"
          icon="report.pdf"
          color={theme.colors.accent}
          loading={busy === 'nutritionist'}
          onPress={() => setSnapshot(buildReportData('nutritionist'))}
        />
      </Card>

      <SectionHeader title="For a Coach" />
      <Card style={{ gap: 10 }} accent={theme.colors.primary}>
        <Row gap={10} style={{ alignItems: 'center' }}>
          <Icon icon="report.coach" size={22} color={theme.colors.primary} />
          <Text variant="h3" style={{ flex: 1 }}>Training & recovery report</Text>
        </Row>
        <Text variant="caption" color="textMuted">
          Training volume, session mix, PRs, streaks and steps, plus sleep, recovery, alcohol,
          your athlete rating, and health considerations.
        </Text>
        <Button
          title="Review coach report"
          icon="report.pdf"
          loading={busy === 'coach'}
          onPress={() => setSnapshot(buildReportData('coach'))}
        />
      </Card>

      {snapshot && <View style={{ gap: 12 }}>
        <SectionHeader title="Choose what to share" />
        <Text color="textMuted">Only selected sections appear in the PDF. Personal details and sensitive health sections start off.</Text>
        {REPORT_SECTIONS.map(section => <Row key={section} style={{ justifyContent: 'space-between' }}>
          <Text style={{ flex: 1 }}>{section}</Text><Switch accessibilityLabel={`Include ${section}`} value={included.includes(section)}
            onValueChange={on => setIncluded(old => on ? [...old, section] : old.filter(s => s !== section))} />
        </Row>)}
        <SectionHeader title="Report preview" />
        {preview.map(section => <Card key={section.title} style={{ gap: 8 }}><Text variant="h3">{section.title}</Text><Text selectable>{section.text}</Text></Card>)}
        {!preview.length && <Text>No selected sections contain data.</Text>}
        <Button title="Create PDF and open share sheet" disabled={!preview.length || !!busy} loading={!!busy} onPress={() => generate(snapshot.audience)} />
      </View>}
      <Text variant="caption" color="textFaint" center>
        Reports are generated on-device from your local data. Nothing is uploaded.
      </Text>
    </Screen>
  );
}
