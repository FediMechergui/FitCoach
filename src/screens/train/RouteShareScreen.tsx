import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Pressable, Alert, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { PageHero } from '@/components/ui/PageHero';
import { Row, EmptyState } from '@/components/ui/misc';
import { RouteStoryCard } from '@/components/RouteStoryCard';
import { RealMapConsent } from '@/components/RealMapConsent';
import type { RootStackParamList } from '@/navigation/types';
import { shareableSession, shareableWalk, type ShareableRoute } from '@/repositories/routeShareRepo';
import { outdoorSettings, setOutdoorSettings } from '@/repositories/outdoorRepo';
import { ownedStoryThemes, wearStoryTheme, wornStoryTheme } from '@/repositories/soukRepo';
import { recordRouteShare } from '@/repositories/eventsRepo';
import { exportStoryPng } from '@/services/cardExport';
import { trimRouteEnds } from '@/lib/mapTiles';
import type { StoryTheme } from '@/data/souk';
import { useUserStore } from '@/stores/userStore';
import { HIDE_ENDS_OPTIONS_M } from '@/lib/outdoorSettings';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ShareRoute = RouteProp<RootStackParamList, 'RouteShare'>;

/**
 * A finished route as a story: on a real map (once agreed to), with the
 * distance marked along it, and the time, pace and calories under it — in a
 * theme from the souk. Shared through the phone's share sheet, so Instagram,
 * WhatsApp and the rest are all one tap: in Instagram, pick "Story".
 *
 * What is SHARED is trimmed: the first and last few hundred metres are cut
 * from the line (Profile → Outdoor & GPS), because where a walk starts and
 * ends is usually a front door. The numbers stay true; only the line is cut.
 */
export function RouteShareScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<ShareRoute>();
  const { width: screenW } = useWindowDimensions();
  const unit = useUserStore((s) => s.user?.unitPreference ?? 'metric');

  const data: ShareableRoute | null = useMemo(
    () => (params.kind === 'walk' ? shareableWalk(params.id) : shareableSession(params.id)),
    [params.kind, params.id]
  );

  const [settings, setSettings] = useState(outdoorSettings);
  const [themes, setThemes] = useState<StoryTheme[]>(() => ownedStoryThemes());
  const [story, setStory] = useState<StoryTheme>(() => wornStoryTheme());
  const [useTiles, setUseTiles] = useState(settings.realMap === 'on');
  const [marks, setMarks] = useState(settings.kmMarkers);
  const [showPace, setShowPace] = useState(true);
  const [showCalories, setShowCalories] = useState(true);
  const [hideM, setHideM] = useState(settings.hideEndsM);
  const [mapReady, setMapReady] = useState(false);
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const cardRef = useRef<View>(null);

  useFocusEffect(
    useCallback(() => {
      // Back from the souk with a new theme: offer it straight away.
      setThemes(ownedStoryThemes());
      setStory(wornStoryTheme());
    }, [])
  );

  const shownRoute = useMemo(() => (data ? trimRouteEnds(data.route, hideM) : []), [data, hideM]);
  const cardW = Math.min(screenW - 32, 380);

  if (!data) {
    return (
      <Screen>
        <EmptyState icon="cardio.gps" title="Nothing to share" message="This route is no longer saved — it may have been deleted." />
      </Screen>
    );
  }

  const go = async (mode: 'share' | 'save') => {
    if (busy) return;
    setBusy(mode);
    try {
      const r = await exportStoryPng(cardRef, { save: mode === 'save' });
      if (!r.ok) {
        if (r.reason === 'permission-denied') Alert.alert('Photos permission needed', 'Allow FitCoach to add to your photos to save the image, or use Share instead.');
        else if (r.reason === 'error') Alert.alert('Could not make the image', r.message ?? 'Unknown error');
      } else {
        if (r.saved || r.shared) recordRouteShare();
        if (mode === 'save' && r.saved) Alert.alert('Saved to Photos', 'Your route is in your photo library, ready for a story.');
      }
    } finally {
      setBusy(null);
    }
  };

  const toggleChip = (label: string, on: boolean, flip: () => void) => (
    <Chip key={label} label={label} active={on} small onPress={flip} color={theme.colors.outdoor} />
  );

  return (
    <Screen>
      <PageHero icon="cardio.gps" color={theme.colors.outdoor} title="Share your route" subtitle="A story-sized image: the route on the map, the distance along it, the numbers under it." />

      {settings.realMap === 'unset' && data.route.length > 1 && (
        <RealMapConsent
          onAnswer={(on) => {
            setSettings(outdoorSettings());
            setUseTiles(on);
            setMapReady(false);
          }}
        />
      )}

      <View style={{ gap: 8 }}>
        <Text variant="label" color="textMuted">
          Theme
        </Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {themes.map((t) => (
            <Chip
              key={t.key}
              label={t.name}
              small
              active={story.key === t.key}
              color={t.line[1]}
              onPress={() => {
                wearStoryTheme(t.key);
                setStory(t);
                setMapReady(false);
              }}
            />
          ))}
          <Chip label="More in the souk" icon="card.trophy" small onPress={() => navigation.navigate('Souk')} />
        </Row>

        <Text variant="label" color="textMuted">
          On the image
        </Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {settings.realMap === 'on' &&
            toggleChip('Real map', useTiles, () => {
              setUseTiles((v) => !v);
              setMapReady(false);
            })}
          {toggleChip('Km markers', marks, () => setMarks((v) => !v))}
          {toggleChip('Pace', showPace, () => setShowPace((v) => !v))}
          {toggleChip('Calories', showCalories, () => setShowCalories((v) => !v))}
        </Row>

        <Text variant="label" color="textMuted">
          Hide where it starts and ends
        </Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {HIDE_ENDS_OPTIONS_M.map((m) => (
            <Chip
              key={m}
              label={m === 0 ? 'Show all' : `${m} m`}
              small
              active={hideM === m}
              onPress={() => {
                setHideM(m);
                setOutdoorSettings({ hideEndsM: m });
                setMapReady(false);
              }}
            />
          ))}
        </Row>
      </View>

      <View style={{ alignItems: 'center' }}>
        <RouteStoryCard
          ref={cardRef}
          width={cardW}
          theme={story}
          route={shownRoute}
          tiles={useTiles}
          marks={marks}
          showPace={showPace}
          showCalories={showCalories}
          segments={hideM > 0 ? undefined : data.segments}
          onMapReady={() => setMapReady(true)}
          unit={unit}
          stats={{
            title: data.title,
            dateText: new Date(data.startTime).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
            distanceM: data.distanceM,
            durationS: data.durationS,
            paceSPerKm: data.paceSPerKm,
            calories: data.calories,
            steps: data.steps,
            extra: data.extra,
          }}
        />
      </View>

      <Card style={{ gap: 8 }}>
        <Button
          title={mapReady ? 'Share to a story' : 'Drawing the map…'}
          icon="card.share"
          color={story.line[1]}
          loading={busy === 'share'}
          disabled={!mapReady || !!busy}
          onPress={() => void go('share')}
        />
        <Button title="Save to Photos" variant="secondary" icon="card.download" loading={busy === 'save'} disabled={!mapReady || !!busy} onPress={() => void go('save')} />
        <Text variant="caption" color="textFaint">
          In Instagram, pick “Story” in the share sheet. The line is cut {hideM > 0 ? `${hideM} m` : 'nowhere'} from each end; the distance and times are the whole thing.
        </Text>
      </Card>

      <Pressable onPress={() => navigation.navigate('OutdoorSettings')} hitSlop={6}>
        <Text variant="caption" color="primary" center>
          Outdoor & GPS settings
        </Text>
      </Pressable>
    </Screen>
  );
}
