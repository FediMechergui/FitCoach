import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/stores/userStore';
import { TabNavigator } from './TabNavigator';

import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { SessionTypePickerScreen } from '@/screens/train/SessionTypePickerScreen';
import { ActiveSessionScreen } from '@/screens/train/ActiveSessionScreen';
import { ExerciseLibraryScreen } from '@/screens/train/ExerciseLibraryScreen';
import { SessionRecapScreen } from '@/screens/train/SessionRecapScreen';
import { WalkScreen } from '@/screens/train/WalkScreen';
import { SessionHistoryScreen } from '@/screens/train/SessionHistoryScreen';
import { SessionDetailScreen } from '@/screens/train/SessionDetailScreen';
import { AddFoodScreen } from '@/screens/nutrition/AddFoodScreen';
import { ExerciseStatsScreen } from '@/screens/stats/ExerciseStatsScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { GoalsScreen } from '@/screens/profile/GoalsScreen';
import { SmokingScreen } from '@/screens/smoking/SmokingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const user = useUserStore((s) => s.user);
  const onboarded = !!user?.onboardedAt;

  const headerBase = {
    headerStyle: { backgroundColor: theme.colors.bg },
    headerTintColor: theme.colors.text,
    headerTitleStyle: { fontWeight: '700' as const },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: theme.colors.bg },
  };

  return (
    <Stack.Navigator screenOptions={headerBase}>
      {!onboarded ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="SessionTypePicker"
            component={SessionTypePickerScreen}
            options={{ title: 'Start a Session', presentation: 'modal' }}
          />
          <Stack.Screen
            name="ActiveSession"
            component={ActiveSessionScreen}
            options={{ title: 'Session', headerBackVisible: false }}
          />
          <Stack.Screen
            name="ExerciseLibrary"
            component={ExerciseLibraryScreen}
            options={{ title: 'Exercise Library' }}
          />
          <Stack.Screen
            name="SessionRecap"
            component={SessionRecapScreen}
            options={{ title: 'Recap', headerBackVisible: false }}
          />
          <Stack.Screen name="Walk" component={WalkScreen} options={{ title: 'Walk / Run' }} />
          <Stack.Screen
            name="SessionHistory"
            component={SessionHistoryScreen}
            options={{ title: 'History' }}
          />
          <Stack.Screen
            name="SessionDetail"
            component={SessionDetailScreen}
            options={{ title: 'Session' }}
          />
          <Stack.Screen
            name="AddFood"
            component={AddFoodScreen}
            options={{ title: 'Add Food', presentation: 'modal' }}
          />
          <Stack.Screen
            name="ExerciseStats"
            component={ExerciseStatsScreen}
            options={{ title: 'Progression' }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: 'Edit Profile' }}
          />
          <Stack.Screen name="Goals" component={GoalsScreen} options={{ title: 'Targets' }} />
          <Stack.Screen name="Smoking" component={SmokingScreen} options={{ title: 'Smoking' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
