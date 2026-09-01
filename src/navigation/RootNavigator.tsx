import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/stores/userStore';
import { TabNavigator } from './TabNavigator';

import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { LogSessionScreen } from '@/screens/train/LogSessionScreen';
import { ActiveSessionScreen } from '@/screens/train/ActiveSessionScreen';
import { ExerciseLibraryScreen } from '@/screens/train/ExerciseLibraryScreen';
import { SessionRecapScreen } from '@/screens/train/SessionRecapScreen';
import { WalkScreen } from '@/screens/train/WalkScreen';
import { SessionHistoryScreen } from '@/screens/train/SessionHistoryScreen';
import { SessionDetailScreen } from '@/screens/train/SessionDetailScreen';
import { WalkDetailScreen } from '@/screens/train/WalkDetailScreen';
import { AddFoodScreen } from '@/screens/nutrition/AddFoodScreen';
import { CustomFoodScreen } from '@/screens/nutrition/CustomFoodScreen';
import { ComposeFoodScreen } from '@/screens/nutrition/ComposeFoodScreen';
import { PhotoFoodScreen } from '@/screens/nutrition/PhotoFoodScreen';
import { MicronutrientsScreen } from '@/screens/nutrition/MicronutrientsScreen';
import { SupplementsScreen } from '@/screens/nutrition/SupplementsScreen';
import { SupplementPlanScreen } from '@/screens/nutrition/SupplementPlanScreen';
import { DietPlanScreen } from '@/screens/nutrition/DietPlanScreen';
import { ProgrammeMealsScreen } from '@/screens/nutrition/ProgrammeMealsScreen';
import { ExerciseStatsScreen } from '@/screens/stats/ExerciseStatsScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { GoalsScreen } from '@/screens/profile/GoalsScreen';
import { SmokingScreen } from '@/screens/smoking/SmokingScreen';
import { SleepScreen } from '@/screens/health/SleepScreen';
import { WorkScreen } from '@/screens/health/WorkScreen';
import { HabitsScreen } from '@/screens/health/HabitsScreen';
import { AlcoholScreen } from '@/screens/health/AlcoholScreen';
import { CycleScreen } from '@/screens/health/CycleScreen';
import { ConditionsScreen } from '@/screens/health/ConditionsScreen';
import { HormonesScreen } from '@/screens/health/HormonesScreen';
import { SplitPickerScreen } from '@/screens/train/SplitPickerScreen';
import { MethodPickerScreen } from '@/screens/train/MethodPickerScreen';
import { ProgramPickerScreen } from '@/screens/train/ProgramPickerScreen';
import { SpecialProgramsScreen } from '@/screens/train/SpecialProgramsScreen';
import { ChallengeScreen } from '@/screens/train/ChallengeScreen';
import { SpecialProgramDetailScreen } from '@/screens/train/SpecialProgramDetailScreen';
import { GrowthScreen } from '@/screens/stats/GrowthScreen';
import { ChangelogScreen } from '@/screens/profile/ChangelogScreen';
import { TrendsScreen } from '@/screens/stats/TrendsScreen';
import { PrayersScreen } from '@/screens/faith/PrayersScreen';
import { FastingScreen } from '@/screens/faith/FastingScreen';
import { BodyScreen } from '@/screens/profile/BodyScreen';
import { ProfileCardScreen } from '@/screens/profile/ProfileCardScreen';
import { AchievementsScreen } from '@/screens/profile/AchievementsScreen';
import { ReportsScreen } from '@/screens/profile/ReportsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const user = useUserStore((s) => s.user);
  const onboarded = !!user?.onboardedAt;

  /*
   * Title ownership: a page has exactly one title. Pages that open with a
   * PageHero (icon tile + h1) get title: '' here, so the native header carries
   * only the back arrow; forms, lists and modals without a hero keep the bar
   * title. Never both — verify-engines enforces the pairing.
   */
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
          <Stack.Screen name="LogSession" component={LogSessionScreen} options={{ title: '', presentation: 'modal' }} />
          <Stack.Screen name="SplitPicker" component={SplitPickerScreen} options={{ title: '' }} />
          <Stack.Screen name="MethodPicker" component={MethodPickerScreen} options={{ title: '' }} />
          <Stack.Screen name="ProgramPicker" component={ProgramPickerScreen} options={{ title: '' }} />
          <Stack.Screen name="SpecialPrograms" component={SpecialProgramsScreen} options={{ title: '' }} />
          <Stack.Screen name="DailyChallenge" component={ChallengeScreen} options={{ title: '' }} />
          <Stack.Screen name="SpecialProgramDetail" component={SpecialProgramDetailScreen} options={{ title: '' }} />
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
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Walk" component={WalkScreen} options={{ title: '' }} />
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
          <Stack.Screen name="WalkDetail" component={WalkDetailScreen} options={{ title: 'Walk / Run' }} />
          <Stack.Screen
            name="AddFood"
            component={AddFoodScreen}
            options={{ title: 'Add Food', presentation: 'modal' }}
          />
          <Stack.Screen
            name="CustomFood"
            component={CustomFoodScreen}
            options={{ title: 'Custom Food', presentation: 'modal' }}
          />
          <Stack.Screen
            name="ComposeFood"
            component={ComposeFoodScreen}
            options={{ title: 'Compose a Dish', presentation: 'modal' }}
          />
          <Stack.Screen
            name="PhotoFood"
            component={PhotoFoodScreen}
            options={{ title: '', presentation: 'modal' }}
          />
          <Stack.Screen name="Micronutrients" component={MicronutrientsScreen} options={{ title: '' }} />
          <Stack.Screen name="Supplements" component={SupplementsScreen} options={{ title: '' }} />
          <Stack.Screen name="SupplementPlan" component={SupplementPlanScreen} options={{ title: '' }} />
          <Stack.Screen name="DietPlan" component={DietPlanScreen} options={{ title: '' }} />
          <Stack.Screen name="ProgrammeMeals" component={ProgrammeMealsScreen} options={{ title: '' }} />
          <Stack.Screen
            name="ExerciseStats"
            component={ExerciseStatsScreen}
            options={{ title: '' }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: 'Edit Profile' }}
          />
          <Stack.Screen name="Goals" component={GoalsScreen} options={{ title: '' }} />
          <Stack.Screen name="Smoking" component={SmokingScreen} options={{ title: '' }} />
          <Stack.Screen name="Sleep" component={SleepScreen} options={{ title: '' }} />
          <Stack.Screen name="Work" component={WorkScreen} options={{ title: '' }} />
          <Stack.Screen name="Habits" component={HabitsScreen} options={{ title: '' }} />
          <Stack.Screen name="Alcohol" component={AlcoholScreen} options={{ title: '' }} />
          <Stack.Screen name="Cycle" component={CycleScreen} options={{ title: '' }} />
          <Stack.Screen name="Conditions" component={ConditionsScreen} options={{ title: '' }} />
          <Stack.Screen name="Hormones" component={HormonesScreen} options={{ title: '' }} />
          <Stack.Screen name="Body" component={BodyScreen} options={{ title: '' }} />
          <Stack.Screen name="ProfileCard" component={ProfileCardScreen} options={{ title: '' }} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: '' }} />
          <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: '' }} />
          <Stack.Screen name="Growth" component={GrowthScreen} options={{ title: '' }} />
          <Stack.Screen name="Changelog" component={ChangelogScreen} options={{ title: '' }} />
          <Stack.Screen name="Trends" component={TrendsScreen} options={{ title: '' }} />
          <Stack.Screen name="Prayers" component={PrayersScreen} options={{ title: '' }} />
          <Stack.Screen name="Fasting" component={FastingScreen} options={{ title: '' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
