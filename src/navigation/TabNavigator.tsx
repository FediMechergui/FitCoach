import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './types';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/constants/icon-map';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { TrainScreen } from '@/screens/train/TrainScreen';
import { NutritionScreen } from '@/screens/nutrition/NutritionScreen';
import { StatsScreen } from '@/screens/stats/StatsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICON = {
  Home: ICONS.nav.home,
  Train: ICONS.nav.train,
  Nutrition: ICONS.nav.nutrition,
  Stats: ICONS.nav.stats,
  Profile: ICONS.nav.profile,
} as const;

/**
 * 3.0: 64px, Lume for the active tab, hairline top. The fifth tab reads "You"
 * — it was never really a profile; it carries a third of the app (body, goals,
 * health modules, app & data), and its 3.0 redesign makes it that hub
 * explicitly. The ROUTE name stays `Profile` so nothing navigating there
 * breaks; only the label changes.
 */
export function TabNavigator() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textFaint,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <Icon def={TAB_ICON[route.name]} size={size ?? 22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Train" component={TrainScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'You' }} />
    </Tab.Navigator>
  );
}
