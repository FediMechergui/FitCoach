import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * FitCoach Expo app configuration.
 * Managed workflow — builds signed APK/AAB via EAS Build (see eas.json).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'FitCoach',
  slug: 'fitcoach',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'fitcoach',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0B1220',
  },
  assetBundlePatterns: ['**/*'],
  android: {
    package: 'com.fitcoach.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0B1220',
    },
    permissions: [
      'ACTIVITY_RECOGNITION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'RECEIVE_BOOT_COMPLETED',
      'POST_NOTIFICATIONS',
    ],
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.fitcoach.app',
    infoPlist: {
      NSMotionUsageDescription:
        'FitCoach uses motion data to count your steps and track walks/runs.',
      NSLocationWhenInUseUsageDescription:
        'FitCoach uses your location to map outdoor sessions and measure distance.',
    },
  },
  plugins: [
    'expo-sqlite',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'FitCoach uses your location to map outdoor sessions and measure distance.',
      },
    ],
    [
      'expo-sensors',
      {
        motionPermission: 'FitCoach uses motion data to count your steps.',
      },
    ],
    'expo-notifications',
  ],
  extra: {
    eas: {
      // projectId is injected by `eas build:configure`.
    },
  },
});
