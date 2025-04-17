import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'jp.dailyfortune.app',
  appName: 'DailyFortune',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'dailyfortune.web.app',
      '*.dailyfortune.web.app'
    ]
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#673ab7",
      splashFullScreen: true,
      splashImmersive: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
