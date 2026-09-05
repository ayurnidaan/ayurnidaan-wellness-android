import type { ExpoConfig, ConfigContext } from 'expo/config';

const isDevelopment =
  process.env.APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_ENV === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isDevelopment ? 'Ayurnidaan (Dev)' : 'Ayurnidaan',
  slug: 'ayurnidaan',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/ayurnidaan-logo.png',
  userInterfaceStyle: 'light',
  scheme: isDevelopment ? 'ayurnidaan-dev' : 'ayurnidaan',
  extra: {
    eas: {
      projectId: '5fd63f99-6df9-4147-bb0d-5cb8d7cde91f',
    },
  },
  experiments: {
    ...config.experiments,
    onDemandFilesystem: false,
  },
  plugins: [
    'expo-web-browser',
    'expo-asset',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F8F4E8',
        image: './assets/ayurnidaan-logo.png',
        imageWidth: 220,
        resizeMode: 'contain',
      },
    ],
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: isDevelopment
      ? 'com.ayurnidaan.wellness.dev'
      : 'com.ayurnidaan.wellness',
  },
  android: {
    package: isDevelopment
      ? 'com.ayurnidaan.wellness.dev'
      : 'com.ayurnidaan.wellness',
    softwareKeyboardLayoutMode: 'resize',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
});
