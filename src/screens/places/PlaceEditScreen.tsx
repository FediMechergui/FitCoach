import React, { useEffect, useMemo, useState } from 'react';
import { View, Switch, Pressable, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { PageHero } from '@/components/ui/PageHero';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Row } from '@/components/ui/misc';
import { EmptyState } from '@/components/ui/misc3';
import { toast } from '@/components/ui/Toast';
import { PLACE_ACCESS, PLACE_KINDS, findPlaceKind, type PlaceKind } from '@/data/placeKinds';
import { GOVERNORATES, REGION_ORDER, findGovernorate, suggestGovernorate } from '@/data/governorates';
import { parseCoord, validCoords } from '@/lib/places';
import { createPlace, deletePlace, getPlace, restorePlace, updatePlace } from '@/repositories/placesRepo';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Mark a place, or change one. The only field that must be filled is the
 * name; coordinates can come from where you are standing or be typed in, and
 * a place with none is still a place.
 */
export function PlaceEditScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'PlaceEdit'>>();
  const editing = params?.placeId != null ? getPlace(params.placeId) : undefined;
  const missing = params?.placeId != null && !editing;

  const [name, setName] = useState(editing?.name ?? '');
  const [kind, setKind] = useState<PlaceKind>((editing?.kind as PlaceKind) ?? 'gym');
  const [lat, setLat] = useState(editing?.latitude != null ? String(editing.latitude) : '');
  const [lng, setLng] = useState(editing?.longitude != null ? String(editing.longitude) : '');
  const [governorate, setGovernorate] = useState<string | null>(editing?.governorate ?? null);
  const [city, setCity] = useState(editing?.city ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [access, setAccess] = useState<string>(editing?.access ?? '');
  const [priceNote, setPriceNote] = useState(editing?.priceNote ?? '');
  const [rating, setRating] = useState<number>(editing?.rating ?? 0);
  const [isHome, setIsHome] = useState<boolean>(editing?.isHome ?? false);
  const [locating, setLocating] = useState(false);
  const [gpsNote, setGpsNote] = useState<string | null>(null);
  const [deniedForGood, setDeniedForGood] = useState(false);
  const [tried, setTried] = useState(false);
  const [pickGov, setPickGov] = useState(false);

  const k = findPlaceKind(kind);
  const latN = parseCoord(lat, 90);
  const lngN = parseCoord(lng, 180);
  const coordsTyped = lat.trim().length > 0 || lng.trim().length > 0;
  const coordsOk = latN != null && lngN != null && validCoords(latN, lngN);
  const suggestion = useMemo(() => (coordsOk ? suggestGovernorate([latN as number, lngN as number]) : null), [coordsOk, latN, lngN]);

  // A fix suggests a governorate once; it never overwrites one that was chosen.
  useEffect(() => {
    if (suggestion && !governorate) setGovernorate(suggestion.governorate.key);
  }, [suggestion, governorate]);

  if (missing)
    return (
      <Screen>
        <EmptyState icon="core.warning" title="That place is gone" message="It may have been deleted. Go back to your places." action={<Button title="Your places" fullWidth={false} onPress={() => navigation.goBack()} />} />
      </Screen>
    );

  const useHere = async () => {
    setLocating(true);
    setGpsNote(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setDeniedForGood(!perm.canAskAgain);
        setGpsNote(perm.canAskAgain ? 'Location was not allowed. You can type the coordinates instead.' : 'Location is switched off for FitCoach. Turn it on in settings, or type the coordinates.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLat(pos.coords.latitude.toFixed(6));
      setLng(pos.coords.longitude.toFixed(6));
      const acc = pos.coords.accuracy != null ? Math.round(pos.coords.accuracy) : null;
      setGpsNote(acc != null ? `Marked where you stand, to within about ${acc} m.` : 'Marked where you stand.');
    } catch {
      setGpsNote('No fix could be had here. Step outside, or type the coordinates.');
    } finally {
      setLocating(false);
    }
  };

  const nameError = tried && !name.trim() ? 'A place needs a name' : undefined;
  const coordError = coordsTyped && !coordsOk ? 'Latitude is between -90 and 90, longitude between -180 and 180' : undefined;

  const save = () => {
    setTried(true);
    if (!name.trim() || coordError) return;
    const input = {
      name,
      kind,
      latitude: coordsOk ? latN : null,
      longitude: coordsOk ? lngN : null,
      governorate,
      city,
      notes,
      access: access || null,
      priceNote,
      rating: rating || null,
      isHome,
      activities: k.fits,
    };
    if (editing) {
      updatePlace(editing.id, input);
      toast({ message: `Saved ${name.trim()}` });
    } else {
      createPlace(input);
      toast({ message: `Marked ${name.trim()}` });
    }
    navigation.goBack();
  };

  const remove = () => {
    if (!editing) return;
    const snap = deletePlace(editing.id);
    navigation.goBack();
    if (snap) toast({ message: `Removed ${snap.place.name}`, actionLabel: 'Undo', onAction: () => restorePlace(snap) });
  };

  const gov = findGovernorate(governorate);

  return (
    <Screen>
      <PageHero icon={k.icon} color={k.color} eyebrow={editing ? 'Change a place' : 'Mark a place'} title={name.trim() || k.label} subtitle={k.local} />

      <Card style={{ gap: 12 }}>
        <Input label="Name" value={name} onChangeText={setName} placeholder="What you call it" error={nameError} maxLength={80} />
        <View style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">
            What it is
          </Text>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {PLACE_KINDS.map((pk) => (
              <Chip key={pk.key} small label={pk.label} icon={pk.icon} color={pk.color} active={kind === pk.key} onPress={() => setKind(pk.key)} />
            ))}
          </Row>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="h3">Where</Text>
          <Button title={locating ? 'Finding you…' : 'Use where I am'} icon="cardio.gps" size="sm" variant="secondary" fullWidth={false} loading={locating} onPress={useHere} />
        </Row>
        {gpsNote ? (
          <Text variant="caption" color="textMuted">
            {gpsNote}
          </Text>
        ) : null}
        {deniedForGood ? <Button title="Open settings" size="sm" variant="ghost" fullWidth={false} onPress={() => Linking.openSettings()} /> : null}
        <Row>
          <View style={{ flex: 1 }}>
            <Input label="Latitude" value={lat} onChangeText={setLat} placeholder="36.8065" keyboardType="numbers-and-punctuation" error={coordError ? ' ' : undefined} />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Longitude" value={lng} onChangeText={setLng} placeholder="10.1815" keyboardType="numbers-and-punctuation" error={coordError ? ' ' : undefined} />
          </View>
        </Row>
        {coordError ? (
          <Text variant="caption" color="danger">
            {coordError}
          </Text>
        ) : (
          <Text variant="caption" color="textFaint">
            Optional. Without coordinates the place is still saved; it just has no distance, no dot on the map and no directions.
          </Text>
        )}

        <Input label="Town or neighbourhood" value={city} onChangeText={setCity} placeholder="La Marsa, Sahloul, Route de Tunis…" maxLength={60} />

        <View style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">
            Governorate
          </Text>
          <Pressable onPress={() => setPickGov((v) => !v)} accessibilityRole="button">
            <Row style={{ justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text variant="body" color={gov ? 'text' : 'textFaint'}>
                {gov ? `${gov.name} · ${gov.ar}` : 'Not set'}
              </Text>
              <Icon icon={pickGov ? 'core.chevronUp' : 'core.chevronDown'} size={16} color={theme.colors.textFaint} />
            </Row>
          </Pressable>
          {suggestion && governorate === suggestion.governorate.key ? (
            <Text variant="caption" color="textFaint">
              Suggested from the coordinates: {suggestion.governorate.seat} is the nearest seat, about {Math.round(suggestion.km)} km away. Near a border this can be wrong; change it if it is.
            </Text>
          ) : null}
          {pickGov &&
            REGION_ORDER.map((r) => (
              <View key={r} style={{ gap: 6 }}>
                <Text variant="eyebrow" color="textFaint">
                  {r}
                </Text>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {GOVERNORATES.filter((g) => g.region === r).map((g) => (
                    <Chip
                      key={g.key}
                      small
                      label={g.name}
                      active={governorate === g.key}
                      onPress={() => {
                        setGovernorate(governorate === g.key ? null : g.key);
                        setPickGov(false);
                      }}
                    />
                  ))}
                </Row>
              </View>
            ))}
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text variant="h3">What it is like</Text>
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder={k.hint} multiline maxLength={400} />
        <View style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">
            Getting in
          </Text>
          <SegmentedControl value={access} onChange={setAccess} options={[{ value: '', label: 'Not said' }, ...PLACE_ACCESS.map((a) => ({ value: a.value as string, label: a.label }))]} />
        </View>
        {access === 'paid' || access === 'members' ? <Input label="Price" value={priceNote} onChangeText={setPriceNote} placeholder="60 TND a month, 5 TND a visit…" maxLength={60} /> : null}
        <View style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">
            Your rating
          </Text>
          <Row gap={10}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(rating === n ? 0 : n)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${n} of 5`}>
                <Text variant="h2" color={n <= rating ? 'warning' : 'textFaint'}>
                  {n <= rating ? '★' : '☆'}
                </Text>
              </Pressable>
            ))}
          </Row>
        </View>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Home base</Text>
            <Text variant="caption" color="textMuted">
              The place you train in most. Only one place can be it.
            </Text>
          </View>
          <Switch value={isHome} onValueChange={setIsHome} trackColor={{ true: theme.colors.primary, false: theme.colors.border }} />
        </Row>
      </Card>

      <Button title={editing ? 'Save changes' : 'Mark this place'} icon="core.check" onPress={save} />
      {editing ? <Button title="Remove this place" variant="ghost" color={theme.colors.danger} onPress={remove} /> : null}
      <Text variant="caption" color="textFaint" center>
        Saved on this phone only. Nothing about a place is sent anywhere.
      </Text>
    </Screen>
  );
}
