import type { NavigatorScreenParams } from '@react-navigation/native';
import type { SessionType, MealType } from '@/db/schema';

export type TabParamList = {
  Home: undefined;
  Train: undefined;
  Nutrition: undefined;
  Stats: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;

  SessionTypePicker: undefined;
  ActiveSession: { sessionId: number };
  ExerciseLibrary: { pick?: boolean } | undefined;
  SessionRecap: { sessionId: number; prCount?: number };
  Walk: { mode: 'walk' | 'run' } | undefined;
  SessionHistory: undefined;
  SessionDetail: { sessionId: number };

  AddFood: { meal: MealType; mode?: 'precise' | 'honest' };

  ExerciseStats: { exerciseId: number; name: string };
  EditProfile: undefined;
  Goals: undefined;
  Smoking: undefined;
};

export type SessionTypeMeta = {
  type: SessionType;
  label: string;
  icon: string;
  color: string;
  blurb: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
