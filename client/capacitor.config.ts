import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'jp.dailyfortune.app',
  appName: 'DailyFortune',
  // バージョン情報（表示用）
  appVersion: '1.0.1-debug',
  // ビルド番号（内部管理用）
  appBuildNumber: '1001',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https', // 本番環境ではHTTPSを使用
    allowNavigation: [
      'dailyfortune.web.app',
      '*.dailyfortune.web.app',
      'localhost',
      'localhost:3000',
      'localhost:8080',
      '192.168.11.6',
      '192.168.11.6:3000',
      '192.168.11.6:8080',
      'dailyfortune-api-6clpzmy5pa-an.a.run.app',
      'dailyfortune-native-api-235426778039.asia-northeast1.run.app',
      '*.asia-northeast1.run.app',
      'run.app',
      '*'  // すべてのドメインを一時的に許可（テスト用）
    ],
    // 本番APIを使用するため、ホスト名と直接のURLは指定しない
    // hostname設定を削除（Web UIからのリダイレクトを防ぐため）
    // ローカルWeb UI使用時のみ、以下のコメントを外す
    // url: 'http://192.168.11.6:3000',
    cleartext: true  // 開発時のみtrue、本番ではfalseに
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
    },
    ScreenOrientation: {
      // デフォルトは縦向き固定
      orientation: "portrait"
    }
  },
  // ディープリンク設定
  // アプリは dailyfortune://, 
  // https://dailyfortune.web.app, 
  // https://*.dailyfortune.web.app の URL スキームで開くことができます
  appUrlOpen: {
    url: "dailyfortune://app",
    target: "self"
  },
  // Android ディープリンク設定 (AndroidManifest.xml に追加されます)
  android: {
    intentFilters: [
      {
        action: "android.intent.action.VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "dailyfortune.web.app",
            pathPrefix: "/"
          },
          {
            scheme: "https",
            host: "*.dailyfortune.web.app",
            pathPrefix: "/"
          },
          {
            scheme: "dailyfortune",
            host: "app"
          }
        ],
        categories: [
          "android.intent.category.DEFAULT",
          "android.intent.category.BROWSABLE"
        ]
      }
    ]
  },
  // iOS ディープリンク設定 (Info.plist に追加されます)
  ios: {
    scheme: "dailyfortune",
    // Universal Links 設定
    associatedDomains: [
      "applinks:dailyfortune.web.app"
    ]
  }
};

export default config;
