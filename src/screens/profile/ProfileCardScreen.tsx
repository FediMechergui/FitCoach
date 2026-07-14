import React, { useCallback, useRef, useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Row } from '@/components/ui/misc';
import { useUserStore } from '@/stores/userStore';
import { computeCardRating } from '@/repositories/cardRepo';
import { currentMonthKey, getProfilePhoto, setProfilePhoto } from '@/repositories/userRepo';
import { exportCardPng } from '@/services/cardExport';
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
  const month = currentMonthKey();

  const refresh = useCallback(() => {
    setRating(computeCardRating());
    setPhotoUri(getProfilePhoto(month)?.uri ?? null);
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
      setProfilePhoto(month, result.assets[0].uri);
      setPhotoUri(result.assets[0].uri);
    }
  };

  if (!user || !rating) return <Screen><Text>Loading…</Text></Screen>;

  const attrs = rating.attributes;
  const topAttr = (Object.keys(attrs) as Array<keyof AttributeSet>).sort((a, b) => attrs[b] - attrs[a])[0];
  const position = ARCHETYPE[topAttr];
  const tier = rating.tierColor;
  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <Screen>
      <Text variant="h1">Athlete Card</Text>
      <Text variant="body" color="textMuted">
        Your card is built from your real stats and refreshes as you train. Set this month's
        photo and share it like a FIFA card.
      </Text>

      {/* The card (captured to PNG) */}
      <View style={{ alignItems: 'center' }}>
        <View
          ref={cardRef}
          collapsable={false}
          style={{ width: 300, height: 460, borderRadius: 24, overflow: 'hidden' }}
        >
          <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id="cardbg" x1="0" y1="0" x2="0.6" y2="1">
                <Stop offset="0" stopColor={tier} stopOpacity={1} />
                <Stop offset="1" stopColor="#0B1220" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#cardbg)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="none" stroke={tier} strokeWidth="4" rx="24" />
          </Svg>

          {/* Header: overall + position + tier */}
          <View style={{ flexDirection: 'row', padding: 18, justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 46, fontWeight: '900', color: '#fff', lineHeight: 48 }}>
                {rating.overall}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 1 }}>
                {position.toUpperCase()}
              </Text>
              <View style={{ marginTop: 4, backgroundColor: '#00000033', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>{rating.tier.toUpperCase()}</Text>
              </View>
            </View>
            <Icon icon="card.star" size={30} color="#ffffffcc" />
          </View>

          {/* Photo */}
          <View style={{ alignItems: 'center', marginTop: -6 }}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: 150, height: 150, borderRadius: 12, borderWidth: 3, borderColor: '#ffffff55' }} />
            ) : (
              <View style={{ width: 150, height: 150, borderRadius: 12, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon="nav.profile" size={70} color="#ffffffaa" />
              </View>
            )}
          </View>

          {/* Name */}
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 }}>
              {user.name.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 11, color: '#ffffffaa' }}>
              {ageFromBirthdate(user.birthdate)} yrs · {monthLabel}
            </Text>
          </View>

          {/* Attributes */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 28, paddingTop: 14, justifyContent: 'space-between' }}>
            {[['STR', 'END', 'CON'], ['NUT', 'REC', 'DIS']].map((col, ci) => (
              <View key={ci} style={{ gap: 6 }}>
                {(col as Array<keyof AttributeSet>).map((k) => (
                  <Row key={k} gap={8} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', width: 26 }}>{attrs[k]}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffffcc' }}>{k}</Text>
                  </Row>
                ))}
              </View>
            ))}
          </View>

          <View style={{ position: 'absolute', bottom: 12, width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#ffffff88', fontWeight: '700', letterSpacing: 2 }}>FITCOACH</Text>
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
        <Button title="Share PNG" icon="card.share" onPress={() => exportCardPng(cardRef, { save: false })} style={{ flex: 1 }} fullWidth={false} />
      </Row>
      <Button title="Save to Photos" icon="card.download" variant="ghost" onPress={() => exportCardPng(cardRef, { save: true })} />
    </Screen>
  );
}
