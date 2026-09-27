import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PageHero } from '@/components/ui/PageHero';
import { Rail } from '@/components/ui/Meter';
import { Row, Divider, SectionHeader } from '@/components/ui/misc';
import { EmptyState, Skeleton } from '@/components/ui/misc3';
import { toast } from '@/components/ui/Toast';
import { chooseTitle, profileIdentity, type ProfileIdentity } from '@/repositories/progressionRepo';
import { xpForLevel } from '@/lib/progression';

/**
 * Level and titles.
 *
 * The level shows its working: every line of experience names the part of
 * your record it was counted from. Titles are earned by the record and worn
 * by choice, one at a time.
 */
export function IdentityScreen() {
  const theme = useTheme();
  const [id, setId] = useState<ProfileIdentity | null>(null);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(() => {
    try {
      setId(profileIdentity());
      setFailed(false);
    } catch (e) {
      console.warn('[identity] failed to read:', e);
      setFailed(true);
    }
  }, []);

  useFocusEffect(reload);

  const hero = (
    <PageHero
      icon="card.trophy"
      color={theme.colors.primary}
      eyebrow="Your record, counted"
      title="Level and titles"
      subtitle="Experience is computed from what you have logged. It is never handed out for a tap."
    />
  );

  if (failed)
    return (
      <Screen>
        {hero}
        <EmptyState icon="core.warning" title="Your level could not be read" message="Nothing is lost. Come back to this page and it will try again." />
      </Screen>
    );

  if (!id)
    return (
      <Screen>
        {hero}
        <Skeleton height={140} />
        <Skeleton height={260} />
      </Screen>
    );

  const { level } = id;

  return (
    <Screen>
      {hero}

      <Card raised style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text variant="eyebrow" color="textMuted">
              Level
            </Text>
            <Text variant="numeralXL">{level.level}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="numeralM">{level.xp.toLocaleString()} XP</Text>
            <Text variant="caption" color="textFaint">
              {level.next != null ? `level ${level.level + 1} at ${level.next.toLocaleString()}` : 'the last level'}
            </Text>
          </View>
        </Row>
        <Rail value={level.progress} max={1} color={theme.colors.primary} height={8} />
        <Text variant="caption" color="textMuted">
          Each level costs 100 experience more than the one before it: level 2 at {xpForLevel(2)}, level 5 at {xpForLevel(5).toLocaleString()}, level 10 at{' '}
          {xpForLevel(10).toLocaleString()}.
        </Text>
      </Card>

      <SectionHeader title="Where it came from" />
      <Card style={{ gap: 8 }}>
        {id.lines.map((l, i) => (
          <View key={l.key}>
            {i > 0 ? <Divider /> : null}
            <Row style={{ justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}>
              <View style={{ flex: 1 }}>
                <Text variant="body" color={l.xp > 0 ? 'text' : 'textFaint'}>
                  {l.label}
                </Text>
                <Text variant="caption" color="textFaint" style={{ fontVariant: ['tabular-nums'] }}>
                  {l.count.toLocaleString()}
                </Text>
              </View>
              <Text variant="label" color={l.xp > 0 ? 'text' : 'textFaint'} style={{ fontVariant: ['tabular-nums'] }}>
                {l.xp > 0 ? `+${l.xp.toLocaleString()}` : '0'}
              </Text>
            </Row>
          </View>
        ))}
        <Text variant="caption" color="textFaint">
          Spending points on the wheel or in the souk never takes experience away: experience counts what you earned, not what you kept.
        </Text>
      </Card>

      <SectionHeader title="Titles" />
      <Card style={{ gap: 4 }}>
        {id.titles.map((t, i) => {
          const worn = t.key === id.title.key;
          return (
            <View key={t.key}>
              {i > 0 ? <Divider /> : null}
              <Card
                padded={false}
                onPress={
                  t.earnedNow && !worn
                    ? () => {
                        chooseTitle(t.key);
                        reload();
                        toast({ message: `You wear "${t.name}" now` });
                      }
                    : undefined
                }
                style={{ borderWidth: 0, backgroundColor: 'transparent', paddingVertical: 8 }}
              >
                <Row gap={10} style={{ alignItems: 'center', opacity: t.earnedNow ? 1 : 0.55 }}>
                  <Icon
                    icon={worn ? 'core.check' : t.earnedNow ? 'core.checkEmpty' : 'core.lock'}
                    size={18}
                    color={worn ? theme.colors.success : theme.colors.textFaint}
                  />
                  <View style={{ flex: 1 }}>
                    <Row gap={6} style={{ alignItems: 'baseline' }}>
                      <Text variant="bodyStrong">{t.name}</Text>
                      {t.meaning ? (
                        <Text variant="caption" color="textFaint" numberOfLines={1} style={{ flex: 1 }}>
                          {t.meaning}
                        </Text>
                      ) : null}
                    </Row>
                    <Text variant="caption" color="textMuted">
                      {t.how}
                    </Text>
                  </View>
                  {worn ? (
                    <Text variant="caption" color="success">
                      worn
                    </Text>
                  ) : null}
                </Row>
              </Card>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}
