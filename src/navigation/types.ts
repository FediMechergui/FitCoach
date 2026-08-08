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
  LogSession: undefined;
  SplitPicker: undefined;
  /** per-category methods / splits / routines */
  MethodPicker: { sessionType: SessionType };
  /** pre-built weekly programs for a category */
  ProgramPicker: { sessionType: SessionType };
  /** themed military / historical / lifestyle programmes */
  SpecialPrograms: undefined;
  /** spin-the-wheel daily challenge */
  DailyChallenge: undefined;
  SpecialProgramDetail: { programKey: string };
  ActiveSession: { sessionId: number };
  /**
   * pick=true selects exercises; sessionId targets a specific (e.g. finished)
   * session; draft=true collects picks for a session that doesn't exist yet
   * (logging a past session).
   */
  ExerciseLibrary:
    | { pick?: boolean; sessionId?: number; draft?: boolean; sessionType?: SessionType }
    | undefined;
  SessionRecap: { sessionId: number; prCount?: number; stepsAdded?: number };
  Walk: { mode: 'walk' | 'run' } | undefined;
  SessionHistory: undefined;
  SessionDetail: { sessionId: number };
  WalkDetail: { walkId: number };

  AddFood: { meal: MealType; mode?: 'precise' | 'honest' };
  /** create a user-entered food, or edit one by id */
  CustomFood: { id?: number } | undefined;
  Micronutrients: undefined;
  Supplements: undefined;
  SupplementPlan: undefined;
  DietPlan: undefined;
  ProgrammeMeals: undefined;

  ExerciseStats: { exerciseId: number; name: string };
  EditProfile: undefined;
  Goals: undefined;
  Smoking: undefined;
  Sleep: undefined;
  Work: undefined;
  Habits: undefined;
  Alcohol: undefined;
  Cycle: undefined;
  Conditions: undefined;
  Hormones: undefined;
  Body: undefined;
  ProfileCard: undefined;
  Achievements: undefined;
  Reports: undefined;
  Growth: undefined;
  Trends: undefined;
  Changelog: undefined;
  Prayers: undefined;
  Fasting: undefined;
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
