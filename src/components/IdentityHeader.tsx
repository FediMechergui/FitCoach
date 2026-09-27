import React from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Rail } from '@/components/ui/Meter';
import { Row } from '@/components/ui/misc';
import { RankCrest } from '@/components/RankCrest';
import { BadgeSvg } from '@/components/BadgeSvg';
import { ACHIEVEMENTS } from '@/data/achievements';
import { SHOWCASE_SLOTS } from '@/lib/progression';
import type { ProfileIdentity } from '@/repositories/progressionRepo';

/**
 * Who you are in the app, in one block: the crest you have earned, the name,
 * the title you chose to wear, the level and how far the next one is, the
 * three numbers that matter, and the badges you pinned.
 *
 * Remodeled with a gradual opacity radial crest aura, frosted glass
 * stat tiles, and minted badge seats.
 */

interface Props {
  name: string;
  detail: string;
  identity: ProfileIdentity | null;
  onEdit: () => void;
  onRank: () => void;
  onLevel: () => void;
  onPoints: () => void;
  onBadges: () => void;
}

export function IdentityHeader({ name, detail, identity, onEdit, onRank, onLevel, onPoints, onBadges }: Props) {
  const theme = useTheme();
  const rank = identity?.rank ?? null;
  const level = identity?.level ?? null;
  const tint = rank ? rank.placement.tier.color : theme.colors.primary;
  const glowId = 'identity-crest-glow';

  return (
    <Card raised style={{ gap: 16, overflow: 'hidden' }}>
      {/* Gradual opacity radial aura behind the Rank Crest */}
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id={glowId} cx="16%" cy="24%" r="45%">
            <Stop offset="0%" stopColor={tint} stopOpacity={0.28} />
            <Stop offset="55%" stopColor={tint} stopOpacity={0.06} />
            <Stop offset="100%" stopColor="transparent" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${glowId})`} />
      </Svg>

      <Row gap={14} style={{ alignItems: 'center', zIndex: 1 }}>
        <Pressable onPress={onRank} accessibilityRole="button" accessibilityLabel="Strength ranks">
          {rank ? (
            <RankCrest tier={rank.placement.tier} division={rank.placement.division} size={76} muted={rank.peakOnly} />
          ) : (
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 24,
                backgroundColor: theme.alpha.tint14(theme.colors.primary),
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.alpha.tint22(theme.colors.primary),
              }}
            >
              <Icon icon="nav.profile" size={42} color={theme.colors.primary} />
            </View>
          )}
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="h1" numberOfLines={1}>
            {name}
          </Text>
          {identity ? (
            <Pressable onPress={onLevel} hitSlop={6}>
              <Row gap={6} style={{ alignItems: 'center' }}>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.alpha.tint14(tint),
                    borderWidth: 1,
                    borderColor: theme.alpha.tint22(tint),
                  }}
                >
                  <Text variant="eyebrow" style={{ color: theme.colors.text, letterSpacing: 1.4 }}>
                    {identity.title.name}
                  </Text>
                </View>
                {identity.title.meaning ? (
                  <Text variant="caption" color="textFaint" numberOfLines={1} style={{ flex: 1 }}>
                    {identity.title.meaning}
                  </Text>
                ) : null}
              </Row>
            </Pressable>
          ) : null}
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {detail}
          </Text>
        </View>
        <Pressable onPress={onEdit} hitSlop={8} accessibilityRole="button" accessibilityLabel="Edit profile">
          <Icon icon="core.edit" size={22} color={theme.colors.textMuted} />
        </Pressable>
      </Row>

      {level ? (
        <Pressable onPress={onLevel} accessibilityRole="button" accessibilityLabel="Level and titles" style={{ zIndex: 1 }}>
          <View style={{ gap: 5 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Row gap={6} style={{ alignItems: 'baseline' }}>
                <Text variant="eyebrow" color="textMuted">
                  Level
                </Text>
                <Text variant="numeralM">{level.level}</Text>
              </Row>
              <Text variant="caption" color="textFaint" style={{ fontVariant: ['tabular-nums'] }}>
                {level.toNext != null ? `${level.toNext.toLocaleString()} XP to level ${level.level + 1}` : 'the last level'}
              </Text>
            </Row>
            <Rail value={level.progress} max={1} color={theme.colors.primary} height={6} />
          </View>
        </Pressable>
      ) : null}

      <Row gap={8} style={{ zIndex: 1 }}>
        <Tile label="Rank" value={rank ? rank.placement.label : 'Unranked'} sub={rank ? (rank.peakOnly ? 'your peak' : rank.provisional ? 'provisional' : `score ${rank.placement.score.toFixed(0)}`) : 'log a lift'} tint={tint} onPress={onRank} />
        <Tile label="Experience" value={level ? level.xp.toLocaleString() : '0'} sub="from your record" tint={theme.colors.primary} onPress={onLevel} />
        <Tile label="Points" value={identity ? identity.balance.toLocaleString() : '0'} sub="to spend" tint={theme.colors.warning} onPress={onPoints} />
      </Row>

      <Pressable onPress={onBadges} accessibilityRole="button" accessibilityLabel="Achievements" style={{ zIndex: 1 }}>
        <Row gap={10} style={{ alignItems: 'center' }}>
          {Array.from({ length: SHOWCASE_SLOTS }, (_, i) => {
            const id = identity?.showcase[i];
            const def = id != null ? ACHIEVEMENTS.find((a) => a.id === id) : undefined;
            return def ? (
              <View
                key={i}
                style={{
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.35,
                  shadowRadius: 4,
                }}
              >
                <BadgeSvg id={def.id} svg={def.svg} size={44} />
              </View>
            ) : (
              <View
                key={i}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: theme.colors.borderStrong,
                  backgroundColor: theme.alpha.tint04(theme.colors.surfaceAlt),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon="core.add" size={16} color={theme.colors.textFaint} />
              </View>
            );
          })}
          <View style={{ flex: 1 }}>
            <Text variant="label">
              {identity ? identity.unlockedBadges.length : 0} of {ACHIEVEMENTS.length} badges
            </Text>
            <Text variant="caption" color="textFaint">
              {identity && identity.showcase.length > 0 ? 'Pinned by you' : 'Pin up to three from Achievements'}
            </Text>
          </View>
          <Icon icon="core.forward" size={16} color={theme.colors.textFaint} />
        </Row>
      </Pressable>
    </Card>
  );
}

function Tile({ label, value, sub, tint, onPress }: { label: string; value: string; sub: string; tint: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flex: 1,
        gap: 1,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: theme.radius.md,
        backgroundColor: theme.alpha.tint08(tint),
        borderWidth: 1,
        borderColor: theme.alpha.tint14(tint),
        borderTopColor: theme.alpha.tint22('#FFFFFF'),
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text variant="eyebrow" color="textMuted" style={{ letterSpacing: 1.2 }}>
        {label}
      </Text>
      <Text variant="bodyStrong" numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text variant="caption" color="textFaint" numberOfLines={1}>
        {sub}
      </Text>
    </Pressable>
  );
}

