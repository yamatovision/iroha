# DailyFortune ネイティブアプリ実装ガイド

## 概要

このドキュメントはDailyFortuneアプリのネイティブ化実装において、開発チームとAIアシスタントの連携方法を詳細に解説します。AppGenius複数AIエージェント開発方法論を活用し、段階的な実装プロセスを提供します。

## AppGenius AIエージェント活用計画

DailyFortuneのネイティブアプリ化プロジェクトでは、各フェーズに最適なAIエージェントを活用します。

### フェーズ1: 要件定義と計画

**使用エージェント**: 
- ★1 要件定義クリエイター
- ★14 追加機能実装アシスタント

**プロンプト例**:
```
「DailyFortuneアプリをネイティブアプリ化するための要件を定義してください。
現在のウェブアプリはReact+TypeScript+Material UI+Express+MongoDBで構築されています。
Capacitorを使った段階的なネイティブ化アプローチの詳細要件を作成してください。
特にネイティブならではの機能（プッシュ通知、オフラインモード、デバイスセンサー活用など）
について詳細に定義し、優先順位をつけてください。」
```

**成果物**:
- `docs/requirements-native.md` - ネイティブアプリの要件定義書
- 初期実装計画とロードマップ

### フェーズ2: アーキテクチャ設計

**使用エージェント**:
- ★2 システムアーキテクチャ

**プロンプト例**:
```
「DailyFortuneのネイティブアプリ版のシステムアーキテクチャを設計してください。
Capacitorを使った実装において、以下の点を詳細に説明してください：
1. プロジェクト構造の調整（既存Webアプリからの変更点）
2. ネイティブ機能アクセスのための抽象レイヤー設計
3. オフライン対応のためのデータフローアーキテクチャ
4. Web版とネイティブ版の共通コード管理戦略
5. 環境変数とシークレットの安全な管理方法」
```

**成果物**:
- アーキテクチャ図とフローチャート
- ディレクトリ構造の詳細設計
- データフロー設計図

### フェーズ3: ストレージとデータモデル調整

**使用エージェント**:
- ★4 データモデル統合
- ★5 データモデル精査

**プロンプト例**:
```
「ネイティブアプリ化に伴うデータモデルの調整を行ってください。
特にLocalStorageからCapacitor Preferencesへの移行と、
オフラインモード対応のためのデータキャッシュ設計に重点を置いてください。
また、ユーザーデータとアプリ設定の管理設計も含めてください。」
```

**成果物**:
- 調整されたデータモデル図
- キャッシュ戦略の詳細設計
- ストレージ層の抽象インターフェース定義

### フェーズ4-5: 初期実装とストレージ移行

**使用エージェント**:
- ★11 スコープ実装

**プロンプト例**:
```
「DailyFortuneアプリにCapacitorを導入し、基本的なネイティブ機能をセットアップしてください。
具体的には以下のタスクの実装をお願いします：
1. 必要なCapacitorパッケージのインストールと初期設定
2. vite.config.tsの調整
3. ネイティブプロジェクトの生成
4. ストレージサービスの抽象化インターフェース作成
5. LocalStorageからCapacitor Preferencesへの移行
6. token.service.tsの非同期処理対応」
```

**成果物**:
- 基本的なCapacitor設定と初期化コード
- ストレージサービスの実装
- 認証フローの非同期対応実装

### フェーズ6: UI最適化

**使用エージェント**:
- ★3 モックアップ作成分析
- ★11 スコープ実装

**プロンプト例**:
```
「DailyFortuneアプリのモバイル向けUI最適化を行ってください。
まず、モバイルデバイスに最適化されたUIのモックアップを作成し、
その後、実装を行ってください。タッチフレンドリーな操作性、
レスポンシブ設計、オフライン状態表示などに重点を置いてください。」
```

**成果物**:
- モバイル最適化UIのモックアップ
- タッチ対応のUI実装
- スプラッシュスクリーンとアイコン設定

### フェーズ7: プッシュ通知実装

**使用エージェント**:
- ★11 スコープ実装

**プロンプト例**:
```
「DailyFortuneアプリにプッシュ通知機能を実装してください。
具体的には、以下の機能を含めてください：
1. Capacitor Push Notificationsプラグイン導入
2. 通知権限の取得と管理
3. Firebase Cloud Messaging (FCM) との連携
4. バックエンドのプッシュ通知送信エンドポイント実装
5. 通知イベントハンドリング」
```

**成果物**:
- プッシュ通知サービスの実装
- バックエンドAPIエンドポイントの実装
- 通知管理画面の実装

### フェーズ8: オフライン対応

**使用エージェント**:
- ★11 スコープ実装
- ★13 フロントエンドデバッグ専門家

**プロンプト例**:
```
「DailyFortuneアプリにオフライン機能を実装してください。
ネットワーク接続がない状態でもアプリの基本機能が動作するよう、
以下の機能を実装してください：
1. ネットワーク状態検出とモニタリング
2. データのローカルキャッシュと同期メカニズム
3. オフライン操作のキューイングと再接続時の同期
4. UIでのオフライン状態表示」
```

**成果物**:
- オフラインモード機能の実装
- ネットワークモニタリングサービス
- データ同期メカニズム

### フェーズ9-10: ビルド設定とテスト

**使用エージェント**:
- ★8 デプロイ設定
- ★12 テスト管理と品質保証

**プロンプト例**:
```
「DailyFortuneネイティブアプリのビルド設定とテスト計画を作成してください。
Android/iOS両プラットフォーム向けに以下を含めてください：
1. ビルド設定（Gradle、Info.plist）の詳細
2. アプリ署名の設定
3. テスト戦略とテストケース設計
4. 各プラットフォームでの動作検証計画」
```

**成果物**:
- ビルド設定ファイル
- テスト計画書と自動テストスクリプト
- 品質保証ガイドライン

### フェーズ11-12: デプロイプロセスと最終リリース

**使用エージェント**:
- ★8 デプロイ設定
- ★12 テスト管理と品質保証

**プロンプト例**:
```
「DailyFortuneネイティブアプリのApp Store/Google Playストアへの
リリース計画とCI/CDパイプラインを設計してください。
以下の内容を含めてください：
1. ストア登録情報（スクリーンショット、説明文など）の準備
2. CI/CDパイプラインの設計
3. バージョン管理と配布プロセス
4. リリース後のモニタリング計画」
```

**成果物**:
- CI/CD設定ファイル
- ストア提出資料
- リリース計画書

## 実装ステップごとの詳細手順

### 1. プロジェクト初期設定

```bash
# 既存プロジェクトのコピー
cp -r DailyFortune DailyFortune-Native
cd DailyFortune-Native

# 不要ファイルの削除
rm -rf .git
rm -rf node_modules
rm -rf client/node_modules
rm -rf server/node_modules

# 新しいGitリポジトリの初期化
git init
git add .
git commit -m "Initial commit: Copy from DailyFortune web project"

# クライアントディレクトリでCapacitor導入
cd client
npm install @capacitor/core @capacitor/cli
npx cap init DailyFortune jp.dailyfortune.app --web-dir=dist
npm install @capacitor/android @capacitor/ios @capacitor/preferences @capacitor/push-notifications @capacitor/splash-screen @capacitor/status-bar

# vite.config.tsの編集
# baseを './' に変更

# ビルドとネイティブプロジェクト生成
npm run build
npx cap add android
npx cap add ios
```

### 2. ストレージサービスの実装

`client/src/services/storage/storage.interface.ts`:
```typescript
export interface IStorageService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
```

`client/src/services/storage/capacitor-storage.service.ts`:
```typescript
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

### 3. 認証システムの調整

`client/src/services/auth/token.service.ts` の修正:
```typescript
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
  
  // 他のメソッドも同様に非同期処理に変更
}

export default new TokenService(new CapacitorStorageService());
```

### 4. プッシュ通知サービスの実装

`client/src/services/notifications/push-notification.service.ts`:
```typescript
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
        
        // 他のイベントリスナー設定...
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

### 5. ネットワーク状態監視の実装

`client/src/services/network/network-monitor.service.ts`:
```typescript
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
  
  // その他のメソッド...
}

export default new NetworkMonitorService();
```

## ベストプラクティス

### 1. 段階的アプローチ

- **最小限の変更からスタート**: まずは基本的なCapacitorラッパーを実装し、動作確認
- **徐々に機能追加**: プッシュ通知、オフラインモードなどを順次追加
- **Web/ネイティブの並行開発**: 両バージョンを並行して開発・テスト

### 2. コードの抽象化

- **プラットフォーム抽象化レイヤーの導入**: Web/ネイティブで異なる実装を抽象インターフェースで隠蔽
- **環境検出**: 実行環境に応じた実装の自動切り替え
- **条件付きインポート**: プラットフォーム固有のコードを条件付きでインポート

### 3. テスト戦略

- **デバイスエミュレータテスト**: 各プラットフォームのエミュレータでの動作確認
- **実機テスト**: 実際のデバイスでの挙動確認
- **ネットワーク状態テスト**: オフライン/オンライン切り替え時の挙動確認

### 4. デバッグ手法

- **Capacitorログの活用**: `npx cap logs android/ios` でネイティブログを確認
- **リモートデバッグ**: SafariウェブインスペクタやChromeリモートデバッグの活用
- **エラートラッキング**: Sentryなどのエラー追跡サービスの導入

## トラブルシューティング

### 1. ビルド関連の問題

- **ビルドエラー**:
  - 解決策: ネイティブプロジェクトの更新 `npx cap sync`
  - 解決策: 依存関係の競合確認 `npm ls [パッケージ名]`

- **プラグイン互換性**:
  - 解決策: Capacitorバージョンとプラグインバージョンの整合性確認
  - 解決策: `package.json`での固定バージョン指定

### 2. ランタイムエラー

- **非同期処理エラー**:
  - 解決策: すべてのストレージアクセスが非同期処理になっていることを確認
  - 解決策: `.then()/.catch()`や`async/await`パターンの一貫した使用

- **プラットフォーム固有の問題**:
  - 解決策: プラットフォーム検出とプラットフォーム固有処理の分離
  - 解決策: Capacitorドキュメント確認と公式フォーラムでの調査

## 結論

DailyFortuneのネイティブアプリ化は、AppGenius複数AIエージェント開発方法論の各専門家を活用することで、効率的かつ段階的に進めることができます。このガイドに従うことで、Webアプリケーションからネイティブアプリへのスムーズな移行が可能になります。

---

**作成日**: 2025/4/16
**文書バージョン**: 1.0