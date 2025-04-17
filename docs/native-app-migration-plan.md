# DailyFortune ネイティブアプリ移行計画

## 概要

本ドキュメントでは、現在のDailyFortuneウェブアプリケーションをCapacitorを使用してネイティブアプリに移行する計画を詳述します。この移行は別プロジェクトとして進め、既存のWebアプリケーションは維持しながら段階的にネイティブ機能を追加していきます。

## プロジェクト構成

### プロジェクト分離戦略

```
DailyFortune/           # 既存のWebアプリケーション（変更なし）
DailyFortune-Native/    # ネイティブアプリ版（新規プロジェクト）
```

### 新規プロジェクトの初期設定

1. 既存プロジェクトのコピー作成
   ```bash
   cp -r DailyFortune DailyFortune-Native
   cd DailyFortune-Native
   ```

2. 不要ファイルの削除
   ```bash
   rm -rf .git       # 新しいGitリポジトリとして初期化するため
   rm -rf node_modules
   rm -rf client/node_modules
   rm -rf admin/node_modules
   rm -rf server/node_modules
   ```

3. 新しいGitリポジトリの初期化
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Copy from DailyFortune web project"
   ```

4. プロジェクト名の更新
   - `package.json`のname属性を`dailyfortune-native`に更新
   - READMEなど各種ドキュメントの修正

## 技術スタック

### 追加パッケージ

| パッケージ名 | 用途 | バージョン |
|------------|------|----------|
| @capacitor/core | Capacitorのコア機能 | ^5.7.0 |
| @capacitor/cli | CLIツール | ^5.7.0 |
| @capacitor/android | Android向けプラットフォーム | ^5.7.0 |
| @capacitor/ios | iOS向けプラットフォーム | ^5.7.0 |
| @capacitor/preferences | ローカルストレージ機能 | ^5.0.0 |
| @capacitor/push-notifications | プッシュ通知機能 | ^5.0.0 |
| @capacitor/splash-screen | スプラッシュ画面 | ^5.0.0 |
| @capacitor/status-bar | ステータスバー制御 | ^5.0.0 |

### サーバー側の変更点

- プッシュ通知のためのエンドポイント追加
- デバイストークン管理の追加
- オフライン対応のためのAPI最適化

## 実装フェーズ

### フェーズ1: プロジェクト設定とCapacitor導入

**目標**: 基本的なCapacitorセットアップとプロジェクト構成の確立

- Capacitorの導入
  ```bash
  cd client
  npm install @capacitor/core @capacitor/cli
  npx cap init DailyFortune jp.dailyfortune.app --web-dir=dist
  npm install @capacitor/android @capacitor/ios @capacitor/preferences @capacitor/push-notifications
  ```

- Vite設定の調整
  ```javascript
  // vite.config.ts
  export default defineConfig({
    // ...existing config
    base: './', // 相対パスを使用するように変更
  });
  ```

- ネイティブプロジェクトの生成
  ```bash
  npm run build
  npx cap add android
  npx cap add ios
  ```

- capacitor.config.tsの設定
  ```typescript
  import { CapacitorConfig } from '@capacitor/cli';

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
  ```

### フェーズ2: ストレージシステムの変更

**目標**: LocalStorageからCapacitor Preferencesへの移行

- ストレージサービスの抽象化
  ```typescript
  // client/src/services/storage/storage.interface.ts
  export interface IStorageService {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  }
  
  // client/src/services/storage/capacitor-storage.service.ts
  import { Preferences } from '@capacitor/preferences';
  import { IStorageService } from './storage.interface';
  
  export class CapacitorStorageService implements IStorageService {
    async get(key: string): Promise<string | null> {
      const { value } = await Preferences.get({ key });
      return value;
    }
    
    async set(key: string, value: string): Promise<void> {
      await Preferences.set({ key, value });
    }
    
    async remove(key: string): Promise<void> {
      await Preferences.remove({ key });
    }
  }
  ```

- トークンサービスの非同期対応
  ```typescript
  // client/src/services/auth/token.service.ts の修正
  import { IStorageService } from '../storage/storage.interface';
  import { CapacitorStorageService } from '../storage/capacitor-storage.service';

  class TokenService {
    private storageService: IStorageService;
    
    constructor(storageService: IStorageService) {
      this.storageService = storageService;
    }
    
    async getAccessToken(): Promise<string | null> {
      return this.storageService.get('df_access_token');
    }
    
    async getRefreshToken(): Promise<string | null> {
      return this.storageService.get('df_refresh_token');
    }
    
    async setTokens(accessToken: string, refreshToken: string): Promise<void> {
      await this.storageService.set('df_access_token', accessToken);
      await this.storageService.set('df_refresh_token', refreshToken);
    }
    
    async clearTokens(): Promise<void> {
      await this.storageService.remove('df_access_token');
      await this.storageService.remove('df_refresh_token');
    }
    
    // その他のメソッドも同様に非同期処理に変更
  }
  
  // Capacitorストレージサービスを使用したインスタンスを作成
  export default new TokenService(new CapacitorStorageService());
  ```

### フェーズ3: 認証コンテキストの調整

**目標**: 認証フローを非同期処理に対応させる

- AuthContextの非同期対応
  - useEffectでのトークン読み込みの非同期化
  - 各認証関数の非同期処理の最適化
  - ユーザープロファイル情報のキャッシュ管理

### フェーズ4: ネットワーク状態監視とオフライン対応

**目標**: アプリのオフライン対応機能の実装

- ネットワーク状態モニター
  ```typescript
  // client/src/services/network/network-monitor.service.ts
  import { Network } from '@capacitor/network';
  
  class NetworkMonitorService {
    private listeners: Array<(status: boolean) => void> = [];
    
    constructor() {
      this.initialize();
    }
    
    private async initialize() {
      // リスナーの設定
      Network.addListener('networkStatusChange', (status) => {
        this.notifyListeners(status.connected);
      });
      
      // 初期状態の取得
      const initialStatus = await Network.getStatus();
      this.notifyListeners(initialStatus.connected);
    }
    
    addListener(callback: (status: boolean) => void) {
      this.listeners.push(callback);
      return () => {
        this.listeners = this.listeners.filter(listener => listener !== callback);
      };
    }
    
    private notifyListeners(connected: boolean) {
      this.listeners.forEach(listener => listener(connected));
    }
    
    async isConnected(): Promise<boolean> {
      const status = await Network.getStatus();
      return status.connected;
    }
  }
  
  export default new NetworkMonitorService();
  ```

- APIサービスのオフライン対応
  - リクエストのキャッシュと再試行ロジック
  - オフライン時のフォールバック処理

### フェーズ5: プッシュ通知の実装

**目標**: プッシュ通知システムの構築

- プッシュ通知サービス
  ```typescript
  // client/src/services/notifications/push-notification.service.ts
  import { PushNotifications } from '@capacitor/push-notifications';
  import apiService from '../api.service';
  
  class PushNotificationService {
    async initialize() {
      try {
        // 権限リクエスト
        const permissionStatus = await PushNotifications.requestPermissions();
        
        if (permissionStatus.receive === 'granted') {
          // 通知の登録
          await PushNotifications.register();
          
          // 各種イベントリスナーの設定
          PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success: ', token.value);
            // トークンをサーバーに送信
            await this.sendTokenToServer(token.value);
          });
          
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push notification received: ', notification);
            // 通知を処理
          });
          
          PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push notification action performed: ', notification);
            // 通知アクションを処理
          });
        }
      } catch (error) {
        console.error('Error initializing push notifications', error);
      }
    }
    
    private async sendTokenToServer(token: string) {
      try {
        await apiService.post('/api/v1/users/device-token', { token });
      } catch (error) {
        console.error('Failed to send device token to server', error);
      }
    }
  }
  
  export default new PushNotificationService();
  ```

- サーバー側のエンドポイント追加
  - デバイストークン登録API
  - FCMを使った通知送信機能

### フェーズ6: UI/UXのモバイル最適化

**目標**: ネイティブアプリに適したUI/UXの実装

- タッチ操作の最適化
  - ボタンサイズの拡大
  - スワイプジェスチャーの追加
  - ナビゲーションの簡素化

- モバイル向けスタイル調整
  - Webviewでの見え方に合わせたCSSの調整
  - iOS/Androidそれぞれのデザインガイドラインへの対応

- スプラッシュスクリーンとアイコン
  - ブランディングに合わせたスプラッシュ画面の設定
  - 各解像度のアイコン作成

### フェーズ7: ネイティブビルド設定

**目標**: Android/iOSビルドの設定と最適化

- Android設定
  - `android/app/build.gradle` の設定
  - マニフェストファイル内の権限設定
  - アプリ署名の設定

- iOS設定
  - Xcodeプロジェクト設定
  - `Info.plist` の権限設定
  - App Store提出用の設定

### フェーズ8: テストとデバッグ

**目標**: ネイティブアプリとしての品質保証

- テスト戦略
  - 実機テスト計画
  - プラットフォーム固有の問題確認
  - ネットワーク状態の変化に対するテスト

- デバッグツール
  - Capacitor Logの活用
  - リモートデバッグの設定
  - クラッシュレポート収集の仕組み

### フェーズ9: 継続的インテグレーション/デプロイ (CI/CD)

**目標**: 自動ビルドとデプロイパイプラインの構築

- GitHub Actionsの設定
  - Android/iOSビルド自動化
  - テスト自動実行
  - ストア提出の自動化

- バージョン管理戦略
  - セマンティックバージョニングの採用
  - Web/ネイティブ版の統一バージョン管理

### フェーズ10: ストアリリース準備

**目標**: App Store/Google Playへの提出準備

- ストア情報準備
  - アプリ説明文
  - スクリーンショットの作成
  - プライバシーポリシーの更新

- 審査対応準備
  - AppleのApp Review Guidelines対応
  - Google Playポリシー対応
  - 年齢制限設定

## リリース計画

1. **内部テストリリース** (フェーズ1-6完了後)
   - 開発チーム内でのテスト配布
   - TestFlight/Firebase App Distributionの活用

2. **ベータテストリリース** (フェーズ7-8完了後)
   - 限定ユーザーへのベータ版配布
   - フィードバック収集と改善

3. **一般公開リリース** (全フェーズ完了後)
   - App Store/Google Playにリリース
   - マーケティング活動の開始

## プロジェクト管理

- **進捗管理**
  - GitHub Projectsを使ったタスク管理
  - フェーズごとのマイルストーン設定

- **コミュニケーション**
  - 週次進捗レポート
  - 課題管理とエスカレーションフロー

## リスク管理

| リスク | 影響度 | 対策 |
|-------|------|------|
| ストア審査の拒否 | 高 | 事前のガイドライン確認と対応 |
| パフォーマンス問題 | 中 | 段階的テストと最適化 |
| API互換性の問題 | 中 | 共通インターフェースの徹底 |
| デバイス固有の問題 | 中 | 多様なデバイスでのテスト |
| 機能パリティの維持 | 高 | Web/ネイティブ機能セットの同期計画 |

## 結論

DailyFortuneのネイティブアプリ化は、Capacitorを活用した段階的アプローチで実施します。別プロジェクトとして進めることで、既存のWebアプリケーションに影響を与えずに安全に移行できます。各フェーズを計画的に進め、品質を確保しながらネイティブアプリならではの機能強化を実現します。

---

**作成日**: 2025/4/16
**文書バージョン**: 1.0