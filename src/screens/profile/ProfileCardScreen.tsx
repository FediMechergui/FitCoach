import React, { useCallback, useRef, useState } from 'react';
import { View, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Row, EmptyState } from '@/components/ui/misc';
import { PageHero } from '@/components/ui/PageHero';
import { useUserStore } from '@/stores/userStore';
import { computeCardRating } from '@/repositories/cardRepo';
import { currentMonthKey, getProfilePhoto, setProfilePhoto } from '@/repositories/userRepo';
import { exportCardPng, persistProfilePhoto, photoStillExists } from '@/services/cardExport';
import { recordCardExport } from '@/repositories/eventsRepo';
import { overallPlacement } from '@/repositories/ranksRepo';
import { RankCrest } from '@/components/RankCrest';
import { wornSkin } from '@/repositories/soukRepo';
import { findSkin, type CardSkin } from '@/data/souk';
import { ATTRIBUTE_LABELS, type CardRating, type AttributeSet } from '@/lib/rating';
import { ageFromBirthdate } from '@/lib/date';

const ARCHETYPE: Record<keyof AttributeSet, string> = {
  STR: 'Powerhouse',
  END: 'Engine',
  CON: 'Ironclad',
  NUT: 'Fuelled',
  REC: 'Regenerator',
  DIS: 'Disciplined',
};

export function ProfileCardScreen() {
  const theme = useTheme();
  const user = useUserStore((s) => s.user);
  const cardRef = useRef<View>(null);
  const [rating, setRating] = useState<CardRating | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const [rank, setRank] = useState<ReturnType<typeof overallPlacement>>(null);
  const [skin, setSkin] = useState<CardSkin>(findSkin(null));
  const month = currentMonthKey();

  const refresh = useCallback(() => {
    setRating(computeCardRating());
    setRank(overallPlacement());
    try {
      setSkin(wornSkin());
    } catch {
      setSkin(findSkin(null));
    }
    const stored = getProfilePhoto(month)?.uri ?? null;
    setPhotoUri(stored);
    // A photo whose file has gone (cache cleared) would render as a blank
    // square on the card — better the placeholder than a hole.
    if (stored) void photoStillExists(stored).then((ok) => { if (!ok) setPhotoUri(null); });
  }, [month]);

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const durable = await persistProfilePhoto(result.assets[0].uri, month);
      setProfilePhoto(month, durable);
      setPhotoUri(durable);
    }
  };

  const doExport = async (mode: 'share' | 'save') => {
    if (busy) return;
    setBusy(mode);
    try {
      const r = await exportCardPng(cardRef, { save: mode === 'save' });
      if (!r.ok) {
        if (r.reason === 'permission-denied') Alert.alert('Photos permission needed', 'Allow FitCoach to add to your photos to save the card, or use Share instead.');
        else if (r.reason === 'error') Alert.alert('Could not export the card', r.message ?? 'Unknown error');
      } else {
        // A file exists: the export happened. Stamp it, with the rating it carried.
        if (r.saved || r.shared) recordCardExport(rating?.overall ?? 0);
        if (mode === 'save' && r.saved) Alert.alert('Saved to Photos', 'Your athlete card is in your photo library.');
      }
    } finally {
      setBusy(null);
    }
  };

  // The rating is computed synchronously, so if it is absent now it stays
  // absent — that is an empty state to explain, never a spinner to fake.
  if (!user || !rating)
    return (
      <Screen>
        <EmptyState
          icon="card.star"
          title="No card to draw yet"
          message="The athlete card is built from your profile and logged training. Finish onboarding and log a session or two, and it appears here."
        />
      </Screen>
    );

  const attrs = rating.attributes;
  const topAttr = (Object.keys(attrs) as Array<keyof AttributeSet>).sort((a, b) => attrs[b] - attrs[a])[0];
  const position = ARCHETYPE[topAttr];
  const tier = rating.tierColor;
  // The default skin keeps the tier's colour at the top, as the card always has.
  const top = skin.tierTinted ? tier : skin.top;
  const frame = skin.tierTinted ? tier : skin.frame;
  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <Screen>
      <PageHero icon="card.star" color={theme.colors.primary} title="Athlete card" subtitle="Your card is built from your real stats and refreshes as you train. Set this month's photo and share it like a FIFA card." />

      {/* The card (captured to PNG) */}
      <View style={{ alignItems: 'center' }}>
        <View
          ref={cardRef}
          collapsable={false}
          style={{
            width: 300,
            height: 460,
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: skin.bottom,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
          }}
        >
          {/* Full-bleed Athlete Photo */}
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : null}

          {/* Gradual Opacity Gradient Scrim & Minted Card Frame */}
          <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id="cardbg" x1="0" y1="0" x2="0.6" y2="1">
                <Stop offset="0" stopColor={top} stopOpacity={photoUri ? 0.55 : 1} />
                <Stop offset="0.25" stopColor={top} stopOpacity={photoUri ? 0.18 : 0.9} />
                <Stop offset="0.55" stopColor={skin.bottom} stopOpacity={photoUri ? 0.78 : 0.96} />
                <Stop offset="1" stopColor={skin.bottom} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#cardbg)" />
            {/* Outer minted frame */}
            <Rect x="0" y="0" width="100%" height="100%" fill="none" stroke={frame} strokeWidth="4" rx="24" />
            {/* Inner fine highlight hairline */}
            <Rect x="2" y="2" width="296" height="456" fill="none" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth="1" rx="22" />
          </Svg>

          {/* Header: overall + position + tier */}
          <View style={{ flexDirection: 'row', padding: 18, justifyContent: 'space-between', zIndex: 2 }}>
            <View>
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: '900',
                  color: '#fff',
                  lineHeight: 50,
                  textShadowColor: 'rgba(0,0,0,0.6)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}
              >
                {rating.overall}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '800',
                  color: '#fff',
                  letterSpacing: 1.2,
                  textShadowColor: 'rgba(0,0,0,0.6)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                }}
              >
                {position.toUpperCase()}
              </Text>
              <View
                style={{
                  marginTop: 4,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.18)',
                  alignSelf: 'flex-start',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>
                  {rating.tier.toUpperCase()}
                </Text>
              </View>
            </View>
            {rank ? (
              <View style={{ alignItems: 'center' }}>
                <RankCrest tier={rank.placement.tier} division={rank.placement.division} size={58} />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: '#ffffffdd',
                    letterSpacing: 1.2,
                    marginTop: 2,
                    textShadowColor: 'rgba(0,0,0,0.6)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {rank.placement.tier.name.toUpperCase()}
                </Text>
              </View>
            ) : (
              <Icon icon="card.star" size={30} color="#ffffffcc" />
            )}
          </View>

          {/* Photo Placeholder / Avatar Center when no photo is uploaded */}
          {!photoUri ? (
            <View style={{ alignItems: 'center', marginTop: 10, zIndex: 2 }}>
              <View
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon="nav.profile" size={72} color="#ffffffaa" />
              </View>
            </View>
          ) : (
            <View style={{ height: 150 }} />
          )}

          {/* Name & Season Tag */}
          <View style={{ alignItems: 'center', marginTop: photoUri ? 8 : 12, zIndex: 2 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: '#fff',
                letterSpacing: 0.8,
                textShadowColor: 'rgba(0,0,0,0.7)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
            >
              {user.name.toUpperCase()}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: '#ffffffcc',
                fontWeight: '600',
                textShadowColor: 'rgba(0,0,0,0.6)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {ageFromBirthdate(user.birthdate)} yrs · {monthLabel}
            </Text>
          </View>

          {/* Attributes Frosted Glass Plate */}
          <View style={{ paddingHorizontal: 22, paddingTop: 14, zIndex: 2 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.16)',
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 18,
              }}
            >
              {[['STR', 'END', 'CON'], ['NUT', 'REC', 'DIS']].map((col, ci) => (
                <View key={ci} style={{ gap: 6 }}>
                  {(col as Array<keyof AttributeSet>).map((k) => (
                    <Row key={k} gap={8} style={{ alignItems: 'center' }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '900',
                          color: '#fff',
                          width: 26,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {attrs[k]}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffffcc' }}>
                        {k}
                      </Text>
                    </Row>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Watermark Branding */}
          <View style={{ position: 'absolute', bottom: 12, width: '100%', alignItems: 'center', zIndex: 2 }}>
            <Text style={{ fontSize: 10, color: '#ffffff88', fontWeight: '800', letterSpacing: 2.5 }}>
              FITCOACH
            </Text>
          </View>
        </View>
      </View>


      {/* Legend */}
      <Row style={{ flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
        {(Object.keys(ATTRIBUTE_LABELS) as Array<keyof AttributeSet>).map((k) => (
          <Text key={k} variant="caption" color="textFaint">
            {k} · {ATTRIBUTE_LABELS[k]}
          </Text>
        ))}
      </Row>

      <Row>
        <Button title={photoUri ? 'Change photo' : 'Add photo'} icon="card.camera" variant="secondary" onPress={pickPhoto} style={{ flex: 1 }} fullWidth={false} />
        <Button title="Share PNG" icon="card.share" loading={busy === 'share'} onPress={() => doExport('share')} style={{ flex: 1 }} fullWidth={false} />
      </Row>
      <Button title="Save to Photos" icon="card.download" variant="ghost" loading={busy === 'save'} onPress={() => doExport('save')} />
    </Screen>
  );
}
