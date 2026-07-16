import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * FitCoach Expo app configuration.
 * Managed workflow — builds signed APK/AAB via EAS Build (see eas.json).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'FitCoach',
  slug: 'fitcoach',
  owner: 'fedimechergui',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'fitcoach',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  // Over-the-air updates (EAS Update): JS/content changes ship straight into
  // installed builds — no APK reinstall. The update is downloaded on launch and
  // applied on the next start (or immediately via Profile → Check for updates).
  updates: {
    url: 'https://u.expo.dev/00d7b01f-b20d-4303-b6cb-8bcb88a8e512',
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  // Updates only apply to builds with the same native runtime — appVersion
  // policy ties that to `version`, so a JS update can never land on an APK
  // whose native modules don't match it.
  runtimeVersion: {
    policy: 'appVersion',
  },
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
      'FOREGROUND_SERVICE_LOCATION',
      'FOREGROUND_SERVICE_HEALTH',
      'RECEIVE_BOOT_COMPLETED',
      'POST_NOTIFICATIONS',
      'READ_MEDIA_IMAGES',
      'WRITE_EXTERNAL_STORAGE',
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
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'FitCoach keeps measuring your walk or run in the background, even when the screen is off.',
      UIBackgroundModes: ['location'],
    },
  },
  plugins: [
    './plugins/withJitpackExclusive',
    'expo-asset',
    'expo-font',
    'expo-sqlite',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'FitCoach uses your location to measure distance and keep tracking your walk or run while the screen is off.',
        locationWhenInUsePermission:
          'FitCoach uses your location to measure distance on outdoor sessions.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      'expo-sensors',
      {
        motionPermission: 'FitCoach uses motion data to count your steps.',
      },
    ],
    'expo-notifications',
    [
      'expo-image-picker',
      {
        photosPermission:
          'FitCoach uses your photos so you can set a monthly profile picture for your athlete card.',
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'FitCoach saves your exported athlete card to your photo library.',
        savePhotosPermission: 'FitCoach saves your exported athlete card to your photo library.',
        isAccessMediaLocationEnabled: false,
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '00d7b01f-b20d-4303-b6cb-8bcb88a8e512',
    },
  },
});
