import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'jp.dailyfortune.app',
  appName: 'DailyFortune',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'http', // iOSでHTTPを許可
    allowNavigation: [
      'dailyfortune.web.app',
      '*.dailyfortune.web.app',
      'localhost',
      'localhost:3000',
      'localhost:8080',
      '192.168.11.6',
      '192.168.11.6:3000',
      '192.168.11.6:8080',
      '*'  // すべてのドメインを一時的に許可（テスト用）
    ],
    url: 'http://192.168.11.6:3000',
    cleartext: true  // 平文HTTP接続を許可
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
