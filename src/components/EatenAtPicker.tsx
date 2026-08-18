import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Row } from '@/components/ui/misc';
import { Icon } from '@/components/ui/Icon';
import { EATEN_AT_PRESETS, clockOf, parseHHMM, resolveEatenAt, type EatenAtChoice } from '@/lib/eatenAt';

/**
 * "When did you finish eating?" — chips for the common answers, "At…" for an
 * exact time. Defaults to just now, so logging as you eat stays one tap; the
 * point is the forgotten meal you add two hours late, which must not read to
 * the digestion clock as if you had just eaten it.
 */
export function EatenAtPicker({
  value,
  onChange,
  dateISO,
}: {
  value: EatenAtChoice;
  onChange: (c: EatenAtChoice) => void;
  /** the diary date being logged to — a past day anchors the time to that day */
  dateISO: string;
}) {
  const theme = useTheme();
  const [custom, setCustom] = useState(value.kind === 'clock');
  const [hhmm, setHhmm] = useState(value.kind === 'clock' ? value.hhmm : '');

  const resolved = useMemo(() => resolveEatenAt(value, dateISO), [value, dateISO]);
  const clockInvalid = value.kind === 'clock' && parseHHMM(value.hhmm) == null && value.hhmm.trim().length > 0;
  const isNow = value.kind === 'now';

  return (
    <View style={{ gap: 6 }}>
      <Row gap={6} style={{ alignItems: 'center' }}>
        <Icon icon="digest.clock" size={14} color={theme.colors.textMuted} />
        <Text variant="label" color="textMuted">Finished eating</Text>
      </Row>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {EATEN_AT_PRESETS.map((p) => {
          const active = !custom && JSON.stringify(p.choice) === JSON.stringify(value);
          return (
            <Chip
              key={p.label}
              label={p.label}
              small
              active={active}
              onPress={() => { setCustom(false); onChange(p.choice); }}
            />
          );
        })}
        <Chip label="At…" small active={custom} onPress={() => { setCustom(true); onChange({ kind: 'clock', hhmm }); }} />
      </ScrollView>
      {custom && (
        <Input
          label="Time you finished (24 h)"
          placeholder="e.g. 13:40"
          value={hhmm}
          onChangeText={(t) => { setHhmm(t); onChange({ kind: 'clock', hhmm: t }); }}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
        />
      )}
      <Text variant="caption" color={clockInvalid ? 'danger' : 'textFaint'}>
        {clockInvalid
          ? 'Enter a time like 13:40.'
          : isNow
            ? 'Logged as finished just now — the training clock starts from this moment.'
            : resolved != null
              ? `Logged as finished at ${clockOf(resolved)} — the training clock counts from then, not from now.`
              : 'Pick a time.'}
      </Text>
    </View>
  );
}
