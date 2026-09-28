import React, { useMemo, useState } from 'react';
import { View, Linking, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHero } from '@/components/ui/PageHero';
import { Row, Divider } from '@/components/ui/misc';
import { EmptyState } from '@/components/ui/misc3';
import { toast } from '@/components/ui/Toast';
import { FoodImage } from '@/components/FoodImage';
import { FOOD_DB } from '@/data/foods';
import { FOOD_IMAGE_CREDITS } from '@/data/foodImageCredits';

/**
 * Who took the food photographs.
 *
 * Every picture bundled with the catalogue comes from Wikimedia Commons under
 * a licence that allows reuse, and most of those licences ask for one thing
 * in return: that the author is named. This page is where they are named.
 */
export function PictureCreditsScreen() {
  const theme = useTheme();
  const [q, setQ] = useState('');

  const rows = useMemo(
    () =>
      FOOD_DB.filter((f) => FOOD_IMAGE_CREDITS[f.id])
        .map((f) => ({ food: f, credit: FOOD_IMAGE_CREDITS[f.id] }))
        .sort((a, b) => a.food.name.localeCompare(b.food.name)),
    []
  );
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? rows.filter((r) => r.food.name.toLowerCase().includes(t) || r.credit.artist.toLowerCase().includes(t)) : rows;
  }, [rows, q]);

  return (
    <Screen>
      <PageHero
        icon="card.camera"
        color={theme.colors.accent}
        eyebrow="Thank you"
        title="Picture credits"
        subtitle="The food photographs come from Wikimedia Commons. These are the people who took them."
      />

      <Card style={{ gap: 6 }}>
        <Text variant="body" color="textMuted">
          {rows.length} of the {FOOD_DB.length} foods in the catalogue have a photograph. Each was cropped to a square and made small; where the licence is Creative Commons Attribution-ShareAlike, the small version is shared under that same licence.
        </Text>
        <Text variant="caption" color="textFaint">
          A food with no photograph shows a tile in the colour of its kind. No free photograph was found for it, and a wrong picture is worse than none.
        </Text>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon="card.camera" title="No pictures are bundled" message="This build of the app carries no food photographs, so there is nobody to credit." />
      ) : (
        <>
          <Input value={q} onChangeText={setQ} placeholder="Search a food or an author" />
          <Card style={{ gap: 0 }}>
            {shown.map(({ food, credit }, i) => (
              <View key={food.id}>
                {i > 0 ? <Divider /> : null}
                <Pressable
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(credit.page).catch(() => toast({ message: 'No browser could open that page' }))}
                >
                  <Row gap={12} style={{ alignItems: 'center', paddingVertical: 8 }}>
                    <FoodImage foodId={food.id} category={food.category} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text variant="body" numberOfLines={1}>
                        {food.name}
                      </Text>
                      <Text variant="caption" color="textMuted" numberOfLines={1}>
                        {credit.artist} · {credit.licence}
                      </Text>
                    </View>
                  </Row>
                </Pressable>
              </View>
            ))}
            {shown.length === 0 ? (
              <Text variant="caption" color="textFaint" style={{ paddingVertical: 12 }}>
                Nothing matches that.
              </Text>
            ) : null}
          </Card>
          <Text variant="caption" color="textFaint" center>
            Tap a line to open the photograph's page on Wikimedia Commons, with its full licence.
          </Text>
        </>
      )}

      <Card style={{ gap: 6 }}>
        <Text variant="eyebrow" color="textMuted">
          Also
        </Text>
        <Text variant="caption" color="textMuted">
          Packaged products and their pictures come from Open Food Facts, under the Open Database Licence and Creative Commons Attribution-ShareAlike. The anatomy figure is react-native-body-highlighter, MIT.
        </Text>
      </Card>
    </Screen>
  );
}
