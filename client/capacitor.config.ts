import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'jp.iroha.app',
  appName: 'いろは',
  // バージョン情報（表示用）
  appVersion: '1.0.2',
  // ビルド番号（内部管理用）
  appBuildNumber: '1002',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor', // iOSではcapacitorスキームを使用してプロキシを無効化
    allowNavigation: [
      'iroha-app.web.app',
      '*.iroha-app.web.app',
      'localhost',
      'localhost:3000',
      'localhost:8080',
      '192.168.11.6',
      '192.168.11.6:3000',
      '192.168.11.6:8080',
      'iroha-api-235426778039.asia-northeast1.run.app',
      'dailyfortune-api-6clpzmy5pa-an.a.run.app',
      'dailyfortune-api-235426778039.asia-northeast1.run.app',
      '*.asia-northeast1.run.app',
      'run.app',
      '*'  // すべてのドメインを一時的に許可（テスト用）
    ],
    // 本番APIを直接使用するための設定
    hostname: 'app',
    androidScheme: 'https',
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
    },
    SpeechRecognition: {
      // 音声認識の言語を日本語に設定
      locale: "ja-JP"
    }
  },
  // ディープリンク設定
  // アプリは iroha://, 
  // https://iroha-app.web.app, 
  // https://*.iroha-app.web.app の URL スキームで開くことができます
  appUrlOpen: {
    url: "iroha://app",
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
            host: "iroha-app.web.app",
            pathPrefix: "/"
          },
          {
            scheme: "https",
            host: "*.iroha-app.web.app",
            pathPrefix: "/"
          },
          {
            scheme: "iroha",
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
    scheme: "iroha",
    // Universal Links 設定
    associatedDomains: [
      "applinks:iroha-app.web.app"
    ]
  }
};

export default config;
