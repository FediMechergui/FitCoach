import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/PageHero';
import { Row } from '@/components/ui/misc';
import { EmptyState, Skeleton } from '@/components/ui/misc3';
import { toast } from '@/components/ui/Toast';
import type { CardSkin } from '@/data/souk';
import { buySkin, buyStoryTheme, soukState, wearSkin, wearStoryTheme, type SoukState } from '@/repositories/soukRepo';
import type { StoryTheme } from '@/data/souk';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * The souk. Points earned by challenges and quests buy skins for the athlete
 * card — and nothing else. Every skin is a place in Tunisia; its colours are
 * the colours of that place.
 */
export function SoukScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [state, setState] = useState<SoukState | null>(null);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(() => {
    try {
      setState(soukState());
      setFailed(false);
    } catch (e) {
      console.warn('[souk] failed to read:', e);
      setFailed(true);
    }
  }, []);

  useFocusEffect(reload);

  const hero = (
    <PageHero
      icon="card.trophy"
      color={theme.colors.warning}
      eyebrow="Es-souk"
      title="The souk"
      subtitle="Spend what the challenges earned. Everything here is something to look at, nothing here is a shortcut."
    />
  );

  if (failed)
    return (
      <Screen>
        {hero}
        <EmptyState icon="core.warning" title="The souk could not open" message="Nothing was spent. Come back to this page and it will try again." />
      </Screen>
    );

  if (!state)
    return (
      <Screen>
        {hero}
        <Skeleton height={90} />
        <Skeleton height={150} />
        <Skeleton height={150} />
      </Screen>
    );

  return (
    <Screen>
      {hero}

      <Card raised accent={theme.colors.warning} style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text variant="eyebrow" color="textMuted">
              In hand
            </Text>
            <Text variant="numeralXL">{state.balance.toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="caption" color="textMuted" style={{ fontVariant: ['tabular-nums'] }}>
              {state.earned.toLocaleString()} earned
            </Text>
            <Text variant="caption" color="textFaint" style={{ fontVariant: ['tabular-nums'] }}>
              {state.spent.toLocaleString()} spent
            </Text>
          </View>
        </Row>
        <Text variant="caption" color="textFaint">
          Points come from the daily challenge and the weekly quests. Your level and your badges count what you earned, so spending here costs you neither.
        </Text>
        <Button title="Earn more at the wheel" variant="secondary" size="sm" icon="core.target" fullWidth={false} onPress={() => navigation.navigate('DailyChallenge')} />
      </Card>

      {state.items.map(({ skin, owned, verdict }) => {
        const worn = state.worn === skin.key;
        const bgGradId = `souk-card-${skin.key}`;
        return (
          <Card
            key={skin.key}
            accent={worn ? theme.colors.primary : owned ? theme.colors.success : undefined}
            style={{
              gap: 12,
              overflow: 'hidden',
              borderColor: worn ? theme.colors.primary : theme.colors.border,
            }}
          >
            {/* Full-card skin gradient wash with gradual opacity fade */}
            <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
              <Defs>
                <LinearGradient id={bgGradId} x1="1" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={skin.top} stopOpacity={worn ? 0.35 : 0.22} />
                  <Stop offset="50%" stopColor={skin.bottom} stopOpacity={worn ? 0.2 : 0.1} />
                  <Stop offset="100%" stopColor={theme.colors.surface} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#${bgGradId})`} />
            </Svg>

            <Row gap={14} style={{ alignItems: 'center', zIndex: 1 }}>
              <Swatch skin={skin} worn={worn} />
              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={6} style={{ alignItems: 'baseline' }}>
                  <Text variant="h3">{skin.name}</Text>
                  <Text variant="caption" color="textFaint">
                    {skin.place}
                  </Text>
                </Row>
                <Text variant="caption" color="textMuted">
                  {skin.story}
                </Text>
              </View>
            </Row>

            <View style={{ zIndex: 1 }}>
              {worn ? (
                <Button
                  title="On your card"
                  variant="secondary"
                  size="sm"
                  disabled
                  hint="This is the skin your athlete card wears now."
                />
              ) : owned ? (
                <Button
                  title="Wear it"
                  size="sm"
                  variant="secondary"
                  onPress={() => {
                    wearSkin(skin.key);
                    reload();
                    toast({ message: `Your card wears ${skin.name}` });
                  }}
                />
              ) : (
                <Button
                  title={`Buy for ${skin.cost} points`}
                  size="sm"
                  disabled={!verdict.ok}
                  hint={
                    !verdict.ok && verdict.reason === 'points'
                      ? `You have ${state.balance}. ${skin.cost - state.balance} more to go.`
                      : undefined
                  }
                  onPress={() => {
                    const r = buySkin(skin.key);
                    reload();
                    toast({
                      message: r.ok
                        ? `${skin.name} is yours, and on your card`
                        : 'Not enough points for that one yet',
                    });
                  }}
                />
              )}
            </View>
          </Card>
        );
      })}

      <Button
        title="See your card"
        variant="ghost"
        icon="card.trophy"
        onPress={() => navigation.navigate('ProfileCard')}
      />

      {/* ── Story themes (3.8.0): the colours a finished route is shared in ── */}
      <View style={{ gap: 4, marginTop: theme.spacing.md }}>
        <Text variant="eyebrow" color="textMuted">
          Story themes
        </Text>
        <Text variant="caption" color="textFaint">
          The colours of a route you share: the card, the map's tint and the line over the streets. Pick one when you share a walk, run or ride.
        </Text>
      </View>
      {state.stories.map(({ theme: t, owned, verdict }) => {
        const worn = state.story === t.key;
        return (
          <Card key={t.key} accent={worn ? theme.colors.primary : owned ? theme.colors.success : undefined} style={{ gap: 12 }}>
            <Row gap={14} style={{ alignItems: 'center' }}>
              <StorySwatch theme={t} />
              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={6} style={{ alignItems: 'baseline' }}>
                  <Text variant="h3">{t.name}</Text>
                  <Text variant="caption" color="textFaint">
                    {t.place}
                  </Text>
                </Row>
                <Text variant="caption" color="textMuted">
                  {t.story}
                </Text>
              </View>
            </Row>
            {worn ? (
              <Button title="On your routes" variant="secondary" size="sm" disabled hint="Shared routes wear this theme now." />
            ) : owned ? (
              <Button
                title="Use it"
                size="sm"
                variant="secondary"
                onPress={() => {
                  wearStoryTheme(t.key);
                  reload();
                  toast({ message: `Your routes wear ${t.name}` });
                }}
              />
            ) : (
              <Button
                title={`Buy for ${t.cost} points`}
                size="sm"
                disabled={!verdict.ok}
                hint={!verdict.ok && verdict.reason === 'points' ? `You have ${state.balance}. ${t.cost - state.balance} more to go.` : undefined}
                onPress={() => {
                  const res = buyStoryTheme(t.key);
                  reload();
                  toast({ message: res.ok ? `${t.name} is yours, and on your routes` : 'Not enough points for that one yet' });
                }}
              />
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

function Swatch({ skin, worn }: { skin: CardSkin; worn?: boolean }) {
  const id = `sw-${skin.key}`;
  return (
    <View
      style={{
        width: 58,
        height: 86,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: skin.frame,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0.6" y2="1">
            <Stop offset="0" stopColor={skin.top} />
            <Stop offset="1" stopColor={skin.bottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        <Rect
          x="1.5"
          y="1.5"
          width="55"
          height="83"
          rx="10.5"
          fill="none"
          stroke={skin.frame}
          strokeWidth="3"
        />
        <Rect
          x="3.5"
          y="3.5"
          width="51"
          height="79"
          rx="8.5"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.25}
          strokeWidth="1"
        />
      </Svg>
    </View>
  );
}


/** A story theme in miniature: its gradient, and its route line crossing it. */
function StorySwatch({ theme }: { theme: StoryTheme }) {
  const id = `ss-${theme.key.replace(/[^a-z0-9]/gi, '')}`;
  const lid = `${id}-l`;
  return (
    <View style={{ width: 50, height: 88, borderRadius: 10, overflow: 'hidden' }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0.3" y2="1">
            <Stop offset="0" stopColor={theme.top} />
            <Stop offset="1" stopColor={theme.bottom} />
          </LinearGradient>
          <LinearGradient id={lid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.line[0]} />
            <Stop offset="0.55" stopColor={theme.line[1]} />
            <Stop offset="1" stopColor={theme.line[2]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        <Path d="M 8 70 C 14 40, 30 56, 26 32 S 40 18, 42 12" stroke={`url(#${lid})`} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
