import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Row } from '@/components/ui/misc';
import { formatWait } from '@/lib/digestion';
import { marginStatuses, STRAIN_LABEL, type Margin, type MarginKey, type Strain } from '@/lib/postSession';

const ICON: Record<MarginKey, string> = {
  water: 'after.water',
  eat: 'after.eat',
  smoke: 'after.smoke',
  alcohol: 'after.alcohol',
  cold: 'after.cold',
  next: 'after.next',
};

const clock = (ms: number): string => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** "in 1 h 20 · from 19:40" / "open since 18:20" / for windows: "eat now — until 20:10" */
function statusLine(m: ReturnType<typeof marginStatuses>[number], now: number): { text: string; tone: 'open' | 'wait' | 'window' | 'late' } {
  if (m.byAt != null) {
    if (now < m.openAt) return { text: `from ${clock(m.openAt)} (in ${formatWait(m.remainingMin)}) · until ${clock(m.byAt)}`, tone: 'wait' };
    if (now <= m.byAt) return { text: `now — until ${clock(m.byAt)}`, tone: 'window' };
    return { text: `window closed ${clock(m.byAt)} — still eat, just sooner next time`, tone: 'late' };
  }
  if (m.waitMin === 0) return { text: 'now', tone: 'open' };
  if (m.open) return { text: `open since ${clock(m.openAt)}`, tone: 'open' };
  if (m.waitMin >= 12 * 60) {
    const d = new Date(m.openAt);
    return { text: `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]} ${clock(m.openAt)} (in ${formatWait(m.remainingMin)})`, tone: 'wait' };
  }
  return { text: `from ${clock(m.openAt)} (in ${formatWait(m.remainingMin)})`, tone: 'wait' };
}

/**
 * The margins after a session — how long between the end of THIS session and
 * a cigarette, a drink, food (a window, not a wait), a cold plunge, the next
 * hard session — scaled by how hard it was. Ticks each minute.
 */
export function PostSessionCard({
  endedAt,
  strain,
  margins,
  compact = false,
  title = 'After this session',
}: {
  endedAt: number;
  strain: Strain;
  margins: Margin[];
  compact?: boolean;
  title?: string;
}) {
  const theme = useTheme();
  const [now, setNow] = useState(Date.now());
  const [expanded, setExpanded] = useState<MarginKey | null>(null);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const statuses = useMemo(() => marginStatuses(margins, endedAt, now), [margins, endedAt, now]);
  const shown = compact ? statuses.filter((m) => m.key !== 'water' && m.key !== 'next' && (!m.open || (m.byAt != null && now <= m.byAt))) : statuses;
  if (compact && shown.length === 0) return null;

  const tone = strain.level === 'brutal' || strain.level === 'hard' ? theme.colors.warning : theme.colors.accent;

  return (
    <Card accent={tone} style={{ gap: 10 }}>
      <Row gap={10} style={{ alignItems: 'center' }}>
        <Icon icon="after.session" size={22} color={tone} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{title}</Text>
          <Text variant="caption" color="textMuted">
            {STRAIN_LABEL[strain.level].charAt(0).toUpperCase() + STRAIN_LABEL[strain.level].slice(1)}
            {strain.drivers.length ? ` — ${strain.drivers.slice(0, 3).join(', ')}` : ''}
            {compact ? '' : ` · ended ${clock(endedAt)}. The margins scale with how hard it was.`}
          </Text>
        </View>
      </Row>

      <View style={{ gap: compact ? 6 : 8 }}>
        {shown.map((m) => {
          const st = statusLine(m, now);
          const color =
            st.tone === 'open' || st.tone === 'window' ? theme.colors.success : st.tone === 'late' ? theme.colors.warning : theme.colors.textMuted;
          const isOpen = expanded === m.key;
          return (
            <Pressable key={m.key} onPress={() => setExpanded(isOpen ? null : m.key)} disabled={compact}>
              <Row gap={8} style={{ alignItems: 'flex-start' }}>
                <Icon icon={ICON[m.key]} size={16} color={color} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="body" style={{ flexShrink: 1 }}>{m.label}</Text>
                    <Text variant="caption" color={color} style={{ fontWeight: '700' }}>{st.text}</Text>
                  </Row>
                  {!compact && (isOpen ? (
                    <>
                      <Text variant="caption" color="textMuted">{m.why}</Text>
                      <Text variant="caption" color="textFaint">{m.advice}</Text>
                    </>
                  ) : (
                    <Text variant="caption" color="textFaint" numberOfLines={1}>{m.advice}</Text>
                  ))}
                </View>
              </Row>
            </Pressable>
          );
        })}
      </View>

      {!compact && (
        <Text variant="caption" color="textFaint">
          Tap a line for the why. Estimates from the standard evidence — the harder the session, the more
          each of these costs, and for longer.
        </Text>
      )}
    </Card>
  );
}
