import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Row, SectionHeader } from '@/components/ui/misc';
import { exportReport } from '@/services/pdfReport';

export function ReportsScreen() {
  const theme = useTheme();
  const [busy, setBusy] = useState<'nutritionist' | 'coach' | null>(null);

  const generate = async (audience: 'nutritionist' | 'coach') => {
    try {
      setBusy(audience);
      await exportReport(audience);
    } catch (e) {
      Alert.alert('Could not generate report', String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Row gap={12} style={{ alignItems: 'center' }}>
        <Icon icon="report.pdf" size={28} color={theme.colors.danger} />
        <Text variant="h1">Reports</Text>
      </Row>
      <Text variant="body" color="textMuted">
        Generate a shareable PDF from your data, tailored for the professional you're working
        with. It opens the share sheet so you can send or save it.
      </Text>

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
          title="Generate nutritionist PDF"
          icon="report.pdf"
          color={theme.colors.accent}
          loading={busy === 'nutritionist'}
          onPress={() => generate('nutritionist')}
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
          title="Generate coach PDF"
          icon="report.pdf"
          loading={busy === 'coach'}
          onPress={() => generate('coach')}
        />
      </Card>

      <Text variant="caption" color="textFaint" center>
        Reports are generated on-device from your local data. Nothing is uploaded.
      </Text>
    </Screen>
  );
}
