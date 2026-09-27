import React from 'react';
import { View, Pressable } from 'react-native';
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
 * Every figure is read from the record. Nothing on this header is a setting.
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

  return (
    <Card raised style={{ gap: 16 }}>
      <Row gap={14} style={{ alignItems: 'center' }}>
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
        <Pressable onPress={onLevel} accessibilityRole="button" accessibilityLabel="Level and titles">
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

      <Row gap={8}>
        <Tile label="Rank" value={rank ? rank.placement.label : 'Unranked'} sub={rank ? (rank.peakOnly ? 'your peak' : rank.provisional ? 'provisional' : `score ${rank.placement.score.toFixed(0)}`) : 'log a lift'} tint={tint} onPress={onRank} />
        <Tile label="Experience" value={level ? level.xp.toLocaleString() : '0'} sub="from your record" tint={theme.colors.primary} onPress={onLevel} />
        <Tile label="Points" value={identity ? identity.balance.toLocaleString() : '0'} sub="to spend" tint={theme.colors.warning} onPress={onPoints} />
      </Row>

      <Pressable onPress={onBadges} accessibilityRole="button" accessibilityLabel="Achievements">
        <Row gap={10} style={{ alignItems: 'center' }}>
          {Array.from({ length: SHOWCASE_SLOTS }, (_, i) => {
            const id = identity?.showcase[i];
            const def = id != null ? ACHIEVEMENTS.find((a) => a.id === id) : undefined;
            return def ? (
              <BadgeSvg key={i} id={def.id} svg={def.svg} size={44} />
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
