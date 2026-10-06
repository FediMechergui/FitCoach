import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from './ui/Card';
import { Text } from './ui/Text';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Row } from './ui/misc';
import { setOutdoorSettings } from '@/repositories/outdoorRepo';

/**
 * Asked once, before the first real map is drawn. The route never leaves the
 * phone, but the map squares around it are downloaded from OpenStreetMap,
 * and a request for a square says where it is. That is the user's call; the
 * offline drawing stays available either way, and the answer can be changed
 * in Profile → Outdoor & GPS.
 */
export function RealMapConsent({ onAnswer }: { onAnswer: (on: boolean) => void }) {
  const theme = useTheme();
  const answer = (on: boolean) => {
    setOutdoorSettings({ realMap: on ? 'on' : 'off' });
    onAnswer(on);
  };
  return (
    <Card accent={theme.colors.outdoor} style={{ gap: 10 }}>
      <Row gap={10} style={{ alignItems: 'center' }}>
        <Icon artistic="glow" icon="cardio.gps" size={20} color={theme.colors.outdoor} />
        <Text variant="h3" style={{ flex: 1 }}>
          Show your routes on a real map?
        </Text>
      </Row>
      <Text variant="caption" color="textMuted">
        The streets come from OpenStreetMap. To draw them, FitCoach downloads the map squares around the route, so their servers see the area it was in. Your route, times and everything else stay on the phone. Squares are kept on the phone, so a route is only asked for once.
      </Text>
      <View style={{ gap: 6 }}>
        <Button title="Use real maps" size="sm" color={theme.colors.outdoor} onPress={() => answer(true)} />
        <Button title="Keep the offline drawing" size="sm" variant="ghost" onPress={() => answer(false)} />
      </View>
    </Card>
  );
}
