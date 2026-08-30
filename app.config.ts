import type { ExpoConfig, ConfigContext } from 'expo/config';

const isDevelopment = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isDevelopment ? 'App Build (Dev)' : 'App Build',
  slug: 'app-build',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: isDevelopment ? 'appbuild-dev' : 'appbuild',
  ios: {
    supportsTablet: true,
    bundleIdentifier: isDevelopment
      ? 'com.yourcompany.appbuild.dev'
      : 'com.yourcompany.appbuild',
  },
  android: {
    package: isDevelopment
      ? 'com.yourcompany.appbuild.dev'
      : 'com.yourcompany.appbuild',
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
