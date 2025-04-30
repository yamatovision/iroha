# データインポート機能 実装ガイド

## 概要

このガイドでは、美姫命アプリケーションにおけるデータインポート機能の実装手順と注意点について説明します。この機能は、美容サロンが顧客（クライアント）データをカレンダーサービス（Google/iCloud）やCSVファイルからインポートし、四柱推命プロフィールを自動的に作成するための機能です。

## 1. アーキテクチャ概要

### 1.1 全体構成

データインポート機能は以下のコンポーネントで構成されます：

```
 ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
 │ クライアントUI  │━━━▶│ バックエンドAPI │━━━▶│ 非同期処理系   │
 └────────────────┘    └────────────────┘    └────────────────┘
                              │                      │
                              ▼                      ▼
                        ┌────────────────┐    ┌────────────────┐
                        │ データストア   │◀━━━│ カレンダーAPI  │
                        │ (MongoDB)     │    │ 連携モジュール  │
                        └────────────────┘    └────────────────┘
```

### 1.2 主要コンポーネント

1. **フロントエンドUI**：
   - CSV選択・アップロードインターフェース
   - フィールドマッピング設定画面
   - プレビュー・インポート実行画面
   - インポート履歴・詳細表示画面
   - カレンダー連携設定画面

2. **バックエンドAPI**：
   - ファイル処理モジュール
   - データ変換・マッピングモジュール
   - Googleカレンダー連携モジュール
   - iCloudカレンダー連携モジュール
   - スケジューラー（自動同期用）

3. **非同期処理系**：
   - バックグラウンドジョブワーカー
   - キューシステム
   - 進捗管理システム

4. **データモデル**：
   - インポート設定
   - インポートセッション
   - インポート履歴
   - エラーログ

## 2. 実装手順

### 2.1 前提条件

- Node.js v16以上
- MongoDB v4.4以上
- express.js（APIサーバー）
- React（フロントエンド）
- Bull（非同期キュー処理）

### 2.2 モデル実装 (サーバーサイド)

#### 2.2.1 インポートセッションモデル (server/src/models/ImportSession.ts)

```typescript
import mongoose from 'mongoose';
import { ImportSourceType, ImportStatus } from '../../../shared';

// 実際のモデル実装は以下を参考に
const importSessionSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    type: String,
    enum: Object.values(ImportSourceType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(ImportStatus),
    default: ImportStatus.PENDING
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  
  // 統計情報
  totalProcessed: {
    type: Number,
    default: 0
  },
  imported: {
    type: Number,
    default: 0
  },
  updated: {
    type: Number,
    default: 0
  },
  skipped: {
    type: Number,
    default: 0
  },
  failed: {
    type: Number,
    default: 0
  },
  
  // 設定情報
  options: {
    updateExisting: {
      type: Boolean,
      default: true
    },
    matchBy: {
      type: [String],
      default: ['email', 'phone', 'name']
    },
    autoCreateSajuProfile: {
      type: Boolean,
      default: true
    },
    importNotes: {
      type: Boolean,
      default: false
    },
    timezone: String,
    dateFormat: String,
    timeFormat: String
  },
  
  // マッピング情報
  mapping: {
    type: Map,
    of: String
  },
  
  // 詳細データ
  errors: [{
    rowIndex: Number,
    recordId: String,
    errorCode: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  }],
  warnings: [{
    rowIndex: Number,
    recordId: String,
    warningCode: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  }],
  logs: [String],
  
  // ファイル情報（CSVの場合）
  fileInfo: {
    originalName: String,
    storagePath: String,
    size: Number,
    mimeType: String,
    headers: [String],
    recordCount: Number
  },
  
  // カレンダー連携情報
  connectionInfo: {
    integrationId: mongoose.Schema.Types.ObjectId,
    syncStartDate: Date,
    syncEndDate: Date,
    calendarIds: [String],
    eventPatterns: [String], // 予約/アポイントメントを識別するキーワードパターン
    appointmentTitlePattern: String, // 予約タイトルからの顧客情報抽出パターン
    extractClientInfoFromDescription: Boolean // 説明欄から顧客情報を抽出するかどうか
  }
}, {
  timestamps: true
});

// インデックス設定
importSessionSchema.index({ organizationId: 1, status: 1, startedAt: -1 });
importSessionSchema.index({ userId: 1, startedAt: -1 });

export const ImportSession = mongoose.model('ImportSession', importSessionSchema);
```

#### 2.2.2 インポート履歴モデル (server/src/models/ImportHistory.ts)

```typescript
import mongoose from 'mongoose';
import { ImportSourceType, ImportStatus } from '../../../shared';

const importHistorySchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImportSession',
    required: true
  },
  source: {
    type: String,
    enum: Object.values(ImportSourceType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(ImportStatus),
    required: true
  },
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date
  },
  
  // 統計情報
  totalProcessed: {
    type: Number,
    required: true
  },
  imported: {
    type: Number,
    required: true
  },
  updated: {
    type: Number,
    required: true
  },
  skipped: {
    type: Number,
    required: true
  },
  failed: {
    type: Number,
    required: true
  },
  
  // ソース詳細
  sourceDetails: {
    name: String,
    size: Number,
    recordCount: Number
  },
  
  // エラー情報フラグ
  hasErrors: {
    type: Boolean,
    default: false
  },
  hasWarnings: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// インデックス設定
importHistorySchema.index({ organizationId: 1, startedAt: -1 });
importHistorySchema.index({ userId: 1, startedAt: -1 });
importHistorySchema.index({ source: 1, status: 1, startedAt: -1 });

export const ImportHistory = mongoose.model('ImportHistory', importHistorySchema);
```

#### 2.2.3 カレンダー連携モデル (server/src/models/CalendarIntegration.ts)

```typescript
import mongoose from 'mongoose';
import { ImportSourceType } from '../../../shared';

const calendarIntegrationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sourceType: {
    type: String,
    enum: [ImportSourceType.GOOGLE_CALENDAR, ImportSourceType.ICLOUD_CALENDAR],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  
  // 認証情報 (暗号化して保存)
  credentials: {
    accessToken: String,
    refreshToken: String,
    expireAt: Date,
    apiKey: String
  },
  
  // 連携設定
  settings: {
    syncFrequency: {
      type: Number,
      default: 60 // デフォルト60分
    },
    selectedCalendars: [String],
    lastSyncAt: Date,
    appointmentPatterns: [String], // 予約イベントを識別するパターン（例: "予約", "appointment"など）
    extractClientFields: {
      type: Map,
      of: String    // 例: {"name": "タイトルの先頭から最初のスペースまで", "phone": "説明の最初の行"}
    },
    autoImport: {
      type: Boolean,
      default: true
    },
    syncStartDays: {
      type: Number,
      default: 30 // 過去30日のイベントを同期
    },
    syncEndDays: {
      type: Number,
      default: 60 // 将来60日のイベントを同期
    }
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'active'
  },
  lastError: {
    code: String,
    message: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// インデックス設定
calendarIntegrationSchema.index({ organizationId: 1, sourceType: 1 });
calendarIntegrationSchema.index({ status: 1, 'settings.lastSyncAt': 1 });

export const CalendarIntegration = mongoose.model('CalendarIntegration', calendarIntegrationSchema);
```

### 2.3 サービス実装 (サーバーサイド)

#### 2.3.1 CSVインポートサービス (server/src/services/csv-import.service.ts)

```typescript
import fs from 'fs';
import csv from 'csv-parser';
import { ImportSession, ImportHistory, Client } from '../models';
import { ImportSourceType, ImportStatus } from '../../../shared';
import Queue from 'bull';

// CSVインポートキュー設定
const importQueue = new Queue('csv-import', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

export class CSVImportService {
  // CSVファイルのアップロード・解析
  async parseCSVFile(filePath: string, options = {}) {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const headers: string[] = [];
      let isFirstRow = true;
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers.push(...headerList);
        })
        .on('data', (data) => {
          results.push(data);
          // 最初の5行だけ取得（プレビュー用）
          if (results.length >= 5) {
            // パイプを一時停止
            this.isPaused = true;
          }
        })
        .on('end', () => {
          resolve({
            headers,
            previewRows: results,
            estimatedRows: this.estimateTotalRows(filePath)
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  
  // インポートセッション作成
  async createImportSession(data: any) {
    const session = new ImportSession({
      organizationId: data.organizationId,
      userId: data.userId,
      source: ImportSourceType.CSV,
      status: ImportStatus.PENDING,
      options: data.options,
      mapping: new Map(Object.entries(data.mappings)),
      fileInfo: {
        originalName: data.fileName,
        storagePath: data.filePath,
        size: data.fileSize,
        headers: data.headers
      }
    });
    
    await session.save();
    return session;
  }
  
  // インポート実行（非同期）
  async executeImport(sessionId: string) {
    // キューにジョブを追加
    const job = await importQueue.add(
      'process-csv',
      { sessionId },
      { attempts: 3 }
    );
    
    return job.id;
  }
  
  // インポート状態の取得
  async getImportStatus(sessionId: string) {
    const session = await ImportSession.findById(sessionId);
    if (!session) {
      throw new Error('Import session not found');
    }
    
    // 進捗率計算
    let progress = 0;
    if (session.status === ImportStatus.PROCESSING && session.fileInfo?.recordCount) {
      progress = Math.round((session.totalProcessed / session.fileInfo.recordCount) * 100);
    } else if (session.status === ImportStatus.COMPLETED) {
      progress = 100;
    }
    
    return {
      status: session.status,
      progress,
      processedRecords: session.totalProcessed,
      totalRecords: session.fileInfo?.recordCount || 0,
      importedRecords: session.imported,
      updatedRecords: session.updated,
      skippedRecords: session.skipped,
      failedRecords: session.failed,
      elapsedTimeSeconds: this.calculateElapsedTime(session.startedAt),
      estimatedTimeRemainingSeconds: this.estimateRemainingTime(session),
      errorSummary: session.errors && session.errors.length > 0 
        ? this.summarizeErrors(session.errors) 
        : undefined
    };
  }
  
  // インポート履歴の作成
  async createImportHistory(session: any) {
    const history = new ImportHistory({
      organizationId: session.organizationId,
      userId: session.userId,
      sessionId: session._id,
      source: session.source,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      totalProcessed: session.totalProcessed,
      imported: session.imported,
      updated: session.updated,
      skipped: session.skipped,
      failed: session.failed,
      sourceDetails: {
        name: session.fileInfo?.originalName,
        size: session.fileInfo?.size,
        recordCount: session.fileInfo?.recordCount || session.totalProcessed
      },
      hasErrors: session.errors && session.errors.length > 0,
      hasWarnings: session.warnings && session.warnings.length > 0
    });
    
    await history.save();
    return history;
  }
  
  // ヘルパーメソッド
  private estimateTotalRows(filePath: string) {
    // ファイルサイズから行数を推定するロジック
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    // 1行あたりの平均バイト数を仮定（例: 100バイト）
    return Math.ceil(fileSizeInBytes / 100);
  }
  
  private calculateElapsedTime(startTime: Date) {
    return Math.round((Date.now() - startTime.getTime()) / 1000);
  }
  
  private estimateRemainingTime(session: any) {
    if (!session.totalProcessed || !session.fileInfo?.recordCount) {
      return undefined;
    }
    
    const elapsedSeconds = this.calculateElapsedTime(session.startedAt);
    const processedRatio = session.totalProcessed / session.fileInfo.recordCount;
    if (processedRatio === 0) return undefined;
    
    const totalEstimatedSeconds = elapsedSeconds / processedRatio;
    return Math.round(totalEstimatedSeconds - elapsedSeconds);
  }
  
  private summarizeErrors(errors: any[]) {
    // エラーの集計
    const errorTypes: Record<string, number> = {};
    let mostCommonError = '';
    let maxCount = 0;
    
    errors.forEach(error => {
      const code = error.errorCode;
      errorTypes[code] = (errorTypes[code] || 0) + 1;
      
      if (errorTypes[code] > maxCount) {
        maxCount = errorTypes[code];
        mostCommonError = code;
      }
    });
    
    return {
      errorTypes,
      mostCommonError: maxCount > 0 ? mostCommonError : undefined
    };
  }
}
```

#### 2.3.2 カレンダー連携サービス (server/src/services/calendar-integration.service.ts)

```typescript
import { google } from 'googleapis';
import axios from 'axios';
import { CalendarIntegration, ImportSession } from '../models';
import { ImportSourceType, ImportStatus } from '../../../shared';
import { ClientDataExtractor } from '../utils/client-data-extractor';

export class CalendarIntegrationService {
  private clientExtractor: ClientDataExtractor;
  
  constructor() {
    this.clientExtractor = new ClientDataExtractor();
  }
  
  // Google認証URL取得
  async getGoogleAuthUrl(organizationId: string, userId: string) {
    const oauth2Client = this.createGoogleOAuth2Client();
    
    // ステートパラメータには組織IDとユーザーIDを含める（セキュリティのため暗号化することを推奨）
    const state = Buffer.from(
      JSON.stringify({ organizationId, userId })
    ).toString('base64');
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly'
    ];
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state
    });
    
    return { authUrl, state };
  }
  
  // iCloud認証設定取得
  async getiCloudAuthSettings(organizationId: string, userId: string) {
    // iCloudの場合はアプリパスワードなどの設定が必要
    return {
      instructions: 'iCloudカレンダーへの接続にはアプリ専用パスワードの設定が必要です。',
      setupUrl: 'https://appleid.apple.com/account/manage',
      steps: [
        'Apple IDのアカウントページにログイン',
        'セキュリティセクションで「アプリパスワード」を選択',
        '「パスワードを生成」を選択し、「美姫命」などのラベルを付けて新しいパスワードを生成',
        '生成されたパスワードをコピーして次の画面でApple IDとともに入力'
      ]
    };
  }
  
  // Googleコールバック処理
  async handleGoogleCallback(code: string, state: string) {
    const decodedState = JSON.parse(
      Buffer.from(state, 'base64').toString()
    );
    const { organizationId, userId } = decodedState;
    
    const oauth2Client = this.createGoogleOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    // 認証情報を保存
    const integration = new CalendarIntegration({
      organizationId,
      userId,
      sourceType: ImportSourceType.GOOGLE_CALENDAR,
      name: 'Google Calendar',
      credentials: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expireAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
      },
      status: 'active'
    });
    
    await integration.save();
    
    // 利用可能なカレンダーを取得
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();
    
    const availableCalendars = (response.data.items || []).map(cal => ({
      id: cal.id,
      name: cal.summary,
      primary: cal.primary || false
    }));
    
    return {
      integrationId: integration._id,
      status: 'connected',
      availableCalendars
    };
  }
  
  // iCloudカレンダー認証処理
  async setupICloudCalendar(organizationId: string, userId: string, credentials: any) {
    try {
      // iCloud認証のバリデーション
      await this.validateICloudCredentials(credentials);
      
      // 認証情報を保存
      const integration = new CalendarIntegration({
        organizationId,
        userId,
        sourceType: ImportSourceType.ICLOUD_CALENDAR,
        name: 'iCloud Calendar',
        credentials: {
          username: credentials.username,
          appPassword: credentials.appPassword // 暗号化して保存する実装が必要
        },
        status: 'active'
      });
      
      await integration.save();
      
      // 利用可能なカレンダーを取得
      const availableCalendars = await this.getICloudCalendars(credentials);
      
      return {
        integrationId: integration._id,
        status: 'connected',
        availableCalendars
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message || 'iCloudカレンダーとの連携に失敗しました'
      };
    }
  }
  
  // カレンダー連携設定更新
  async updateCalendarConfig(integrationId: string, config: any) {
    const integration = await CalendarIntegration.findById(integrationId);
    if (!integration) {
      throw new Error('Calendar integration not found');
    }
    
    integration.settings = {
      ...integration.settings,
      syncFrequency: config.syncFrequency,
      selectedCalendars: config.selectedCalendars,
      appointmentPatterns: config.appointmentPatterns || ['予約', '施術', 'appointment', 'reservation'],
      extractClientFields: new Map(Object.entries(config.extractClientFields || {})),
      autoImport: config.autoImport,
      syncStartDays: config.syncStartDays || 30,
      syncEndDays: config.syncEndDays || 60
    };
    
    await integration.save();
    
    // 次回同期時刻を計算
    const nextSyncTime = new Date();
    nextSyncTime.setMinutes(nextSyncTime.getMinutes() + config.syncFrequency);
    
    return {
      integrationId,
      message: 'Calendar configuration updated successfully',
      nextSyncTime
    };
  }
  
  // カレンダー手動同期
  async syncCalendar(integrationId: string, userId: string) {
    const integration = await CalendarIntegration.findById(integrationId);
    if (!integration) {
      throw new Error('Calendar integration not found');
    }
    
    // インポートセッション作成
    const session = new ImportSession({
      organizationId: integration.organizationId,
      userId,
      source: integration.sourceType,
      status: ImportStatus.PENDING,
      connectionInfo: {
        integrationId: integration._id,
        syncStartDate: this.calculateSyncStartDate(integration.settings.syncStartDays),
        syncEndDate: this.calculateSyncEndDate(integration.settings.syncEndDays),
        calendarIds: integration.settings.selectedCalendars,
        eventPatterns: integration.settings.appointmentPatterns
      }
    });
    
    await session.save();
    
    // 非同期処理で同期を開始
    await this.startCalendarSync(session._id);
    
    return {
      importId: session._id,
      message: 'Calendar synchronization started',
      status: 'processing'
    };
  }
  
  // カレンダーイベントから顧客データを抽出するメソッド
  async extractClientsFromCalendarEvents(events: any[], extractRules: any) {
    const clients = [];
    
    for (const event of events) {
      try {
        // イベントが予約かどうかをチェック
        if (!this.isAppointmentEvent(event, extractRules.appointmentPatterns)) {
          continue;
        }
        
        // 顧客データ抽出
        const clientData = this.clientExtractor.extractFromCalendarEvent(
          event,
          extractRules.extractClientFields
        );
        
        if (clientData.name || clientData.email || clientData.phone) {
          // 抽出に成功した場合、日時情報を追加
          clientData.appointmentDate = event.start.dateTime || event.start.date;
          clientData.appointmentEndDate = event.end.dateTime || event.end.date;
          clientData.eventId = event.id;
          clientData.calendarId = event.calendarId;
          
          clients.push(clientData);
        }
      } catch (error) {
        console.error(`Event processing error:`, error);
        // エラーログを記録
      }
    }
    
    return clients;
  }
  
  // カレンダーイベントを取得
  async getCalendarEvents(integration: any, startDate: Date, endDate: Date, calendarIds: string[]) {
    if (integration.sourceType === ImportSourceType.GOOGLE_CALENDAR) {
      return await this.getGoogleCalendarEvents(integration, startDate, endDate, calendarIds);
    } else if (integration.sourceType === ImportSourceType.ICLOUD_CALENDAR) {
      return await this.getICloudCalendarEvents(integration, startDate, endDate, calendarIds);
    }
    
    throw new Error(`Unsupported calendar type: ${integration.sourceType}`);
  }
  
  // ヘルパーメソッド
  private createGoogleOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }
  
  private async validateICloudCredentials(credentials: any) {
    // iCloudカレンダーの認証情報を検証するロジック
    // 実際の実装ではiCloudのCalDAV APIを使用して認証を検証
    try {
      // ここでAPIリクエストを送信して認証を確認
      return true;
    } catch (error) {
      throw new Error('iCloudの認証情報の検証に失敗しました: ' + error.message);
    }
  }
  
  private async getICloudCalendars(credentials: any) {
    // iCloudカレンダーの一覧を取得するロジック
    // 実際の実装ではiCloudのCalDAV APIを使用
    return [
      { id: 'primary', name: 'プライマリカレンダー', primary: true },
      { id: 'work', name: '仕事', primary: false }
    ];
  }
  
  private calculateSyncStartDate(syncBackwardsDays = 30) {
    const date = new Date();
    date.setDate(date.getDate() - syncBackwardsDays);
    return date;
  }
  
  private calculateSyncEndDate(syncForwardDays = 60) {
    const date = new Date();
    date.setDate(date.getDate() + syncForwardDays);
    return date;
  }
  
  private async startCalendarSync(sessionId: string) {
    // 非同期処理を開始（実際の実装ではBullキューを使用）
    const job = await new Queue('calendar-sync').add(
      'sync-calendar',
      { sessionId },
      { attempts: 3 }
    );
    
    return job.id;
  }
  
  private isAppointmentEvent(event: any, patterns: string[]) {
    // イベントが予約かどうかをチェック
    const title = event.summary || '';
    const description = event.description || '';
    
    // パターンのいずれかがタイトルまたは説明に含まれているかチェック
    return patterns.some(pattern => 
      title.includes(pattern) || description.includes(pattern)
    );
  }
  
  private async getGoogleCalendarEvents(integration: any, startDate: Date, endDate: Date, calendarIds: string[]) {
    try {
      const oauth2Client = this.createGoogleOAuth2Client();
      oauth2Client.setCredentials({
        access_token: integration.credentials.accessToken,
        refresh_token: integration.credentials.refreshToken
      });
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const allEvents = [];
      
      // 各カレンダーからイベントを取得
      for (const calendarId of calendarIds) {
        const response = await calendar.events.list({
          calendarId,
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        });
        
        // カレンダーIDを各イベントに追加
        const events = (response.data.items || []).map(event => ({
          ...event,
          calendarId
        }));
        
        allEvents.push(...events);
      }
      
      return allEvents;
    } catch (error) {
      // アクセストークンの更新が必要な場合は自動更新
      if (error.response && error.response.status === 401) {
        await this.refreshGoogleToken(integration);
        // 再帰的に呼び出し
        return this.getGoogleCalendarEvents(integration, startDate, endDate, calendarIds);
      }
      
      throw error;
    }
  }
  
  private async getICloudCalendarEvents(integration: any, startDate: Date, endDate: Date, calendarIds: string[]) {
    // iCloudカレンダーからイベントを取得するロジック
    // 実際の実装ではiCloudのCalDAV APIを使用
    
    // 実装例（実際には適切なライブラリを使用）
    try {
      const allEvents = [];
      
      // 実際の実装では、適切なCalDAV/iCal処理ライブラリを使用して
      // 各カレンダーからイベントを取得するコードを実装
      
      return allEvents;
    } catch (error) {
      console.error('iCloud calendar events fetch error:', error);
      throw new Error('iCloudカレンダーからのイベント取得に失敗しました');
    }
  }
  
  private async refreshGoogleToken(integration: any) {
    try {
      const oauth2Client = this.createGoogleOAuth2Client();
      oauth2Client.setCredentials({
        refresh_token: integration.credentials.refreshToken
      });
      
      const { tokens } = await oauth2Client.refreshAccessToken();
      
      // トークン更新
      integration.credentials.accessToken = tokens.access_token;
      if (tokens.refresh_token) {
        integration.credentials.refreshToken = tokens.refresh_token;
      }
      if (tokens.expiry_date) {
        integration.credentials.expireAt = new Date(tokens.expiry_date);
      }
      
      await integration.save();
    } catch (error) {
      console.error('Token refresh error:', error);
      integration.status = 'error';
      integration.lastError = {
        code: 'TOKEN_REFRESH_ERROR',
        message: error.message,
        timestamp: new Date()
      };
      await integration.save();
      throw new Error('認証トークンの更新に失敗しました');
    }
  }
}
```

### 2.4 顧客データ抽出ユーティリティ (server/src/utils/client-data-extractor.ts)

```typescript
export class ClientDataExtractor {
  // カレンダーイベントから顧客データを抽出
  extractFromCalendarEvent(event: any, extractRules: Map<string, string>) {
    const clientData: any = {
      name: null,
      email: null,
      phone: null,
      birthdate: null,
      gender: null,
      notes: null
    };
    
    const title = event.summary || '';
    const description = event.description || '';
    
    // 抽出ルールに従って各フィールドを抽出
    extractRules.forEach((rule, field) => {
      if (typeof rule === 'string') {
        switch (rule) {
          case 'title':
            clientData[field] = title;
            break;
          case 'title_first_word':
            clientData[field] = this.extractFirstWord(title);
            break;
          case 'description_first_line':
            clientData[field] = this.extractFirstLine(description);
            break;
          case 'description':
            clientData[field] = description;
            break;
          case 'email_from_description':
            clientData[field] = this.extractEmail(description);
            break;
          case 'phone_from_description':
            clientData[field] = this.extractPhone(description);
            break;
          case 'birthdate_from_description':
            clientData[field] = this.extractBirthdate(description);
            break;
          default:
            // カスタム正規表現ルール
            if (rule.startsWith('regex:')) {
              const regex = new RegExp(rule.substring(6));
              const match = (title + '\n' + description).match(regex);
              if (match && match[1]) {
                clientData[field] = match[1].trim();
              }
            }
        }
      }
    });
    
    return clientData;
  }
  
  // イベントタイトルからの顧客名抽出例
  extractTitlePatterns(title: string, pattern: string) {
    // 例: "予約: 山田太郎" から "山田太郎" を抽出
    const prefixMatch = title.match(new RegExp(`${pattern}[\\s:：]\\s*(.+)`));
    if (prefixMatch) {
      return prefixMatch[1].trim();
    }
    
    // 例: "山田太郎 カット" から "山田太郎" を抽出
    const suffixMatch = title.match(new RegExp(`(.+?)\\s+${pattern}`));
    if (suffixMatch) {
      return suffixMatch[1].trim();
    }
    
    return null;
  }
  
  // ヘルパーメソッド
  private extractFirstWord(text: string): string {
    const match = text.match(/^(\S+)/);
    return match ? match[1] : '';
  }
  
  private extractFirstLine(text: string): string {
    const lines = text.split(/\r?\n/);
    return lines[0] || '';
  }
  
  private extractEmail(text: string): string | null {
    const match = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    return match ? match[0] : null;
  }
  
  private extractPhone(text: string): string | null {
    // 日本の電話番号パターン
    const match = text.match(/\b(?:\+?81|0)\d{1,4}[\s-]?\d{1,4}[\s-]?\d{4}\b/);
    return match ? match[0].replace(/[\s-]/g, '') : null;
  }
  
  private extractBirthdate(text: string): string | null {
    // 日付パターン (YYYY/MM/DD, MM/DD/YYYY など)
    const patterns = [
      /\b(\d{4})[\/\-年](\d{1,2})[\/\-月](\d{1,2})[日]?\b/,  // YYYY/MM/DD
      /\b(\d{1,2})[\/\-月](\d{1,2})[\/\-日](\d{4})[年]?\b/,  // MM/DD/YYYY
      /\b(\d{1,2})[\/\-月](\d{1,2})[日]?\b/                   // MM/DD (年なし)
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match.length >= 4) {
          // YYYY/MM/DD or MM/DD/YYYY
          if (pattern.source.startsWith('\\b(\\d{4})')) {
            // YYYY/MM/DD
            return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
          } else {
            // MM/DD/YYYY
            return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
          }
        } else {
          // MM/DD (年なし) - 現在の年を使用
          const year = new Date().getFullYear();
          return `${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
        }
      }
    }
    
    return null;
  }
}
```

### 2.5 コントローラー実装 (サーバーサイド)

#### 2.5.1 CSVインポートコントローラー (server/src/controllers/csv-import.controller.ts)

```typescript
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { CSVImportService } from '../services/csv-import.service';
import { validateFieldMapping } from '../utils/import-validator';

// ファイルアップロード設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'tmp/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // CSVファイルのみ許可
    if (file.mimetype === 'text/csv' || 
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const csvImportService = new CSVImportService();

export class CSVImportController {
  // CSVファイルのアップロード
  async uploadCSV(req: Request, res: Response) {
    try {
      // multerを使用してファイルをアップロード
      upload.single('file')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            error: {
              code: 'FILE_UPLOAD_ERROR',
              message: err.message
            }
          });
        }

        if (!req.file) {
          return res.status(400).json({
            error: {
              code: 'NO_FILE',
              message: 'No file uploaded'
            }
          });
        }

        try {
          // CSVファイルの解析
          const parseResult = await csvImportService.parseCSVFile(req.file.path);
          
          // 成功レスポンス
          res.json({
            uploadId: req.file.filename,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            headers: parseResult.headers,
            previewRows: parseResult.previewRows,
            recordCount: parseResult.estimatedRows,
            detectedEncoding: 'UTF-8' // 実際には検出ロジックを実装
          });
        } catch (parseError) {
          return res.status(400).json({
            error: {
              code: 'PARSE_ERROR',
              message: 'Failed to parse CSV file',
              details: parseError.message
            }
          });
        }
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during file upload'
        }
      });
    }
  }

  // フィールドマッピング設定
  async setFieldMapping(req: Request, res: Response) {
    try {
      const { uploadId, mappings, options } = req.body;
      
      // バリデーション
      const validationResult = validateFieldMapping(mappings);
      if (!validationResult.isValid) {
        return res.status(400).json({
          error: {
            code: 'INVALID_MAPPING',
            message: validationResult.message
          }
        });
      }
      
      // マッピング情報を含むインポートセッション作成
      const session = await csvImportService.createImportSession({
        organizationId: req.organizationId, // ミドルウェアからの情報
        userId: req.userId, // ミドルウェアからの情報
        fileName: req.body.fileName,
        filePath: path.join('tmp/uploads/', uploadId),
        fileSize: req.body.fileSize,
        headers: req.body.headers,
        mappings,
        options
      });
      
      res.json({
        sessionId: session._id,
        message: 'Field mapping configured successfully',
        validMappings: Object.keys(mappings).length,
        requiredFields: {
          name: !!mappings.name
          // 他の必須フィールド
        }
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while setting field mapping'
        }
      });
    }
  }

  // インポート実行
  async executeImport(req: Request, res: Response) {
    try {
      const { sessionId } = req.body;
      
      // 非同期インポート処理を開始
      const jobId = await csvImportService.executeImport(sessionId);
      
      res.json({
        importId: sessionId,
        status: 'processing',
        message: 'Import process started successfully',
        estimatedTimeSeconds: 30 // 仮の値
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while starting import process'
        }
      });
    }
  }

  // インポート状態確認
  async checkImportStatus(req: Request, res: Response) {
    try {
      const { importId } = req.params;
      
      const status = await csvImportService.getImportStatus(importId);
      
      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while checking import status'
        }
      });
    }
  }
}
```

#### 2.5.2 カレンダー連携コントローラー (server/src/controllers/calendar-integration.controller.ts)

```typescript
import { Request, Response } from 'express';
import { CalendarIntegrationService } from '../services/calendar-integration.service';

const calendarService = new CalendarIntegrationService();

export class CalendarIntegrationController {
  // カレンダー連携一覧取得
  async getCalendarIntegrations(req: Request, res: Response) {
    try {
      const organizationId = req.organizationId;
      const integrations = await CalendarIntegration.find({ organizationId });
      
      res.json({
        integrations: integrations.map(i => ({
          id: i._id,
          name: i.name,
          type: i.sourceType,
          status: i.status,
          lastSync: i.settings?.lastSyncAt,
          selectedCalendars: i.settings?.selectedCalendars?.length || 0
        }))
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'カレンダー連携情報の取得に失敗しました'
        }
      });
    }
  }
  
  // Google認証URL取得
  async getGoogleAuthUrl(req: Request, res: Response) {
    try {
      const { authUrl, state } = await calendarService.getGoogleAuthUrl(
        req.organizationId,
        req.userId
      );
      
      res.json({ authUrl, state });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'AUTH_URL_ERROR',
          message: 'Google認証URLの生成に失敗しました'
        }
      });
    }
  }
  
  // iCloud認証設定取得
  async getICloudAuthSettings(req: Request, res: Response) {
    try {
      const settings = await calendarService.getiCloudAuthSettings(
        req.organizationId,
        req.userId
      );
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'AUTH_SETTINGS_ERROR',
          message: 'iCloud認証設定の取得に失敗しました'
        }
      });
    }
  }
  
  // Googleコールバック処理
  async handleGoogleCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.body;
      
      if (!code || !state) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PARAMS',
            message: 'Code and state parameters are required'
          }
        });
      }
      
      const result = await calendarService.handleGoogleCallback(code, state);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'CALLBACK_ERROR',
          message: 'Google認証コールバック処理に失敗しました'
        }
      });
    }
  }
  
  // iCloudカレンダー設定
  async setupICloudCalendar(req: Request, res: Response) {
    try {
      const { username, appPassword } = req.body;
      
      if (!username || !appPassword) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PARAMS',
            message: 'Username and app password are required'
          }
        });
      }
      
      const result = await calendarService.setupICloudCalendar(
        req.organizationId,
        req.userId,
        { username, appPassword }
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'SETUP_ERROR',
          message: 'iCloudカレンダーの設定に失敗しました'
        }
      });
    }
  }
  
  // カレンダー連携設定更新
  async updateCalendarConfig(req: Request, res: Response) {
    try {
      const { integrationId } = req.params;
      const config = req.body;
      
      const result = await calendarService.updateCalendarConfig(integrationId, config);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'CONFIG_UPDATE_ERROR',
          message: 'カレンダー連携設定の更新に失敗しました'
        }
      });
    }
  }
  
  // カレンダー同期実行
  async syncCalendar(req: Request, res: Response) {
    try {
      const { integrationId } = req.params;
      
      const result = await calendarService.syncCalendar(integrationId, req.userId);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'SYNC_ERROR',
          message: 'カレンダー同期の開始に失敗しました'
        }
      });
    }
  }
  
  // カレンダー連携解除
  async disconnectCalendar(req: Request, res: Response) {
    try {
      const { integrationId } = req.params;
      
      // カレンダー連携の無効化
      const integration = await CalendarIntegration.findById(integrationId);
      if (!integration) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'カレンダー連携が見つかりません'
          }
        });
      }
      
      integration.status = 'inactive';
      await integration.save();
      
      res.json({
        message: 'カレンダー連携を解除しました',
        integrationId
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'DISCONNECT_ERROR',
          message: 'カレンダー連携の解除に失敗しました'
        }
      });
    }
  }
}
```

### 2.6 ワーカー実装 (サーバーサイド)

カレンダー同期とCSVインポートを非同期で実行するワーカープロセスを実装します。

```typescript
// server/src/workers/import-workers.ts
import Queue from 'bull';
import fs from 'fs';
import csv from 'csv-parser';
import { ImportSession, ImportHistory, Client, CalendarIntegration } from '../models';
import { ImportStatus, ImportSourceType } from '../../../shared';
import { CalendarIntegrationService } from '../services/calendar-integration.service';
import { ClientDataExtractor } from '../utils/client-data-extractor';

// キュー設定
const csvImportQueue = new Queue('csv-import', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

const calendarSyncQueue = new Queue('calendar-sync', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

// 依存サービス初期化
const calendarService = new CalendarIntegrationService();
const clientExtractor = new ClientDataExtractor();

// CSVインポートジョブを処理
csvImportQueue.process('process-csv', async (job) => {
  const { sessionId } = job.data;
  
  try {
    // セッション情報取得
    const session = await ImportSession.findById(sessionId);
    if (!session) {
      throw new Error('Import session not found');
    }
    
    // 処理開始状態にアップデート
    session.status = ImportStatus.PROCESSING;
    await session.save();
    
    // CSVファイル処理
    const results = await processCSVFile(session);
    
    // 完了ステータスに更新
    session.status = ImportStatus.COMPLETED;
    session.completedAt = new Date();
    await session.save();
    
    // インポート履歴作成
    await createImportHistory(session);
    
    return results;
  } catch (error) {
    console.error('CSV Import error:', error);
    
    // エラー状態に更新
    try {
      const session = await ImportSession.findById(sessionId);
      if (session) {
        session.status = ImportStatus.FAILED;
        session.logs.push(`Error: ${error.message}`);
        await session.save();
      }
    } catch (updateError) {
      console.error('Error updating session status:', updateError);
    }
    
    throw error;
  }
});

// カレンダー同期ジョブを処理
calendarSyncQueue.process('sync-calendar', async (job) => {
  const { sessionId } = job.data;
  
  try {
    // セッション情報取得
    const session = await ImportSession.findById(sessionId);
    if (!session) {
      throw new Error('Import session not found');
    }
    
    // 処理開始状態にアップデート
    session.status = ImportStatus.PROCESSING;
    await session.save();
    
    // カレンダー連携情報取得
    const integration = await CalendarIntegration.findById(session.connectionInfo.integrationId);
    if (!integration) {
      throw new Error('Calendar integration not found');
    }
    
    // カレンダーイベント取得
    const events = await calendarService.getCalendarEvents(
      integration,
      session.connectionInfo.syncStartDate,
      session.connectionInfo.syncEndDate,
      session.connectionInfo.calendarIds
    );
    
    // 顧客データ抽出
    const clients = await calendarService.extractClientsFromCalendarEvents(
      events,
      {
        appointmentPatterns: session.connectionInfo.eventPatterns,
        extractClientFields: integration.settings.extractClientFields
      }
    );
    
    // 顧客データの処理（作成/更新）
    const results = await processClientsData(clients, session, integration);
    
    // 同期情報更新
    integration.settings.lastSyncAt = new Date();
    await integration.save();
    
    // 完了ステータスに更新
    session.status = ImportStatus.COMPLETED;
    session.completedAt = new Date();
    session.totalProcessed = clients.length;
    session.imported = results.imported;
    session.updated = results.updated;
    session.skipped = results.skipped;
    session.failed = results.failed;
    await session.save();
    
    // インポート履歴作成
    await createImportHistory(session);
    
    return results;
  } catch (error) {
    console.error('Calendar Sync error:', error);
    
    // エラー状態に更新
    try {
      const session = await ImportSession.findById(sessionId);
      if (session) {
        session.status = ImportStatus.FAILED;
        session.logs.push(`Error: ${error.message}`);
        await session.save();
      }
    } catch (updateError) {
      console.error('Error updating session status:', updateError);
    }
    
    throw error;
  }
});

// CSVファイル処理ヘルパー
async function processCSVFile(session) {
  return new Promise((resolve, reject) => {
    const filePath = session.fileInfo.storagePath;
    const mapping = session.mapping;
    const options = session.options;
    
    const results = {
      processed: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0
    };
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (data) => {
        try {
          results.processed++;
          
          // データマッピング適用
          const clientData = mapCsvRowToClientData(data, mapping);
          
          // データ検証とクライアント作成/更新処理
          const processResult = await processClientData(clientData, session);
          
          // 結果カウント更新
          if (processResult.action === 'created') {
            results.imported++;
          } else if (processResult.action === 'updated') {
            results.updated++;
          } else if (processResult.action === 'skipped') {
            results.skipped++;
          }
          
          // 定期的にセッション状態更新（100件ごと）
          if (results.processed % 100 === 0) {
            await updateSessionProgress(session._id, results);
          }
        } catch (error) {
          results.failed++;
          // エラーログ
          // 処理は継続
        }
      })
      .on('end', async () => {
        // 最終的なセッション状態更新
        await updateSessionProgress(session._id, results);
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// その他の実装ヘルパー関数...
// mapCsvRowToClientData, processClientData, updateSessionProgress, createImportHistory, processClientsData

// マッピング適用ヘルパー
function mapCsvRowToClientData(row, mapping) {
  const clientData = {};
  
  // マッピングに従ってデータを抽出
  for (const [field, csvColumn] of mapping.entries()) {
    if (row[csvColumn] !== undefined) {
      clientData[field] = row[csvColumn];
    }
  }
  
  return clientData;
}

// ... その他の実装
```

### 2.7 フロントエンド実装 (クライアントサイド)

#### 2.7.1 インポートサービス (client/src/services/import.service.ts)

```typescript
import { api } from './api.service';
import { IMPORT } from '../../../shared';

export class ImportService {
  // CSVアップロード
  async uploadCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(IMPORT.CSV_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
  
  // マッピング設定
  async setFieldMapping(data: any) {
    return api.post(IMPORT.CSV_MAPPING, data);
  }
  
  // インポート実行
  async executeImport(sessionId: string) {
    return api.post(IMPORT.CSV_EXECUTE, { sessionId });
  }
  
  // インポート状態確認
  async checkImportStatus(importId: string) {
    return api.get(IMPORT.STATUS(importId));
  }
  
  // インポート履歴取得
  async getImportHistory(params = {}) {
    return api.get(IMPORT.HISTORY, { params });
  }
  
  // Google認証URL取得
  async getGoogleAuthUrl() {
    return api.get(IMPORT.GOOGLE_AUTH_URL);
  }
  
  // Googleコールバック処理
  async handleGoogleCallback(code: string, state: string) {
    return api.post(IMPORT.GOOGLE_CALLBACK, { code, state });
  }
  
  // iCloud認証設定取得
  async getICloudAuthSettings() {
    return api.get(IMPORT.ICLOUD_AUTH_SETTINGS);
  }
  
  // iCloudカレンダー設定
  async setupICloudCalendar(username: string, appPassword: string) {
    return api.post(IMPORT.ICLOUD_SETUP, { username, appPassword });
  }
  
  // カレンダー連携設定更新
  async updateCalendarConfig(integrationId: string, config: any) {
    return api.put(IMPORT.CALENDAR_CONFIG(integrationId), config);
  }
  
  // カレンダー連携一覧取得
  async getCalendarIntegrations() {
    return api.get(IMPORT.CALENDAR_LIST);
  }
  
  // カレンダー同期実行
  async syncCalendar(integrationId: string) {
    return api.post(IMPORT.CALENDAR_SYNC(integrationId));
  }
  
  // カレンダー連携解除
  async disconnectCalendar(integrationId: string) {
    return api.delete(IMPORT.CALENDAR_DISCONNECT(integrationId));
  }
}

export const importService = new ImportService();
```

## 3. 実装における注意点

### 3.1 パフォーマンス最適化

1. **大規模CSVインポート**:
   - ストリーム処理を使用して、一度にすべてをメモリに読み込まない
   - バッチ処理で進捗状況を定期的に更新
   - 行ごとの処理を非同期で行い、Node.jsのイベントループをブロックしない

2. **カレンダー同期処理**:
   - 増分同期を実装（前回の同期以降の変更のみ取得）
   - 同期頻度に合わせた適切なキャッシュ戦略
   - Google/iCloudのAPIレート制限を考慮したスロットリング
   - イベントデータ解析を効率的に行うインデックス活用

3. **データベースパフォーマンス**:
   - 適切なインデックスの作成（特に頻繁に検索される項目）
   - バルクインサート/アップデート操作の利用
   - クエリ最適化とモニタリング

### 3.2 セキュリティ考慮事項

1. **ファイル処理**:
   - アップロードされたファイルの厳格な検証
   - 一時ファイルの安全な管理と処理後の削除
   - ディレクトリトラバーサル攻撃の防止

2. **認証と認可**:
   - インポート機能はAdmin・Owner権限以上に制限
   - 組織間のデータ分離を厳格に実装
   - セッションハイジャック防止策の実装

3. **外部API連携**:
   - OAuth認証フローのセキュアな実装
   - 認証情報の安全な保存（暗号化）
   - トークンの適切な更新と失効管理

### 3.3 エラーハンドリングとロギング

1. **詳細なエラー情報収集**:
   - 行番号、フィールド名、エラー内容の記録
   - エラーの種類ごとの分類（データ形式エラー、重複エラーなど）

2. **エラーレポート**:
   - 集計されたエラー情報の表示
   - 修正アドバイスの提供
   - エラーログのダウンロード機能

3. **処理継続オプション**:
   - エラー発生時の処理継続/中断の選択肢
   - エラーレコードのスキップと後処理オプション

### 3.4 カレンダーデータ抽出の最適化

1. **イベント識別**:
   - 予約/アポイントメントの特定のためのキーワードパターンの改善
   - 偽陽性を減らすための文脈解析

2. **顧客データ抽出**:
   - 各フィールド（名前、メール、電話など）の抽出精度向上
   - 複数のパターンマッチング戦略の組み合わせ
   - 機械学習ベースの抽出モデルの検討（将来的な拡張）

3. **データ検証**:
   - 抽出されたデータの形式とバリデーション
   - 欠損値の処理と補完戦略

## 4. 展開と運用

### 4.1 依存関係

- Node.js v16以上
- MongoDB v4.4以上
- Redis (キュー処理用)
- **パッケージ**:
  - express: APIサーバー
  - mongoose: MongoDB ORM
  - multer: ファイルアップロード処理
  - csv-parser: CSV処理
  - bull: 非同期キュー処理
  - googleapis: Google API連携
  - ical.js: iCalendar/CalDAV処理

### 4.2 環境変数

```
# 基本設定
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/beauty-fortune
REDIS_HOST=localhost
REDIS_PORT=6379

# 外部API連携
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/v1/import/calendar/google/callback

# 暗号化キー（認証情報保護用）
ENCRYPTION_KEY=your-encryption-key

# ファイルアップロード
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=tmp/uploads
```

### 4.3 デプロイ手順

1. **サーバー準備**:
   - Node.jsとMongoDBのインストール
   - Redis（キュー処理用）のインストール
   - 必要なディレクトリ構造の作成

2. **アプリケーションデプロイ**:
   - コードのクローンまたはコピー
   - 依存パッケージのインストール: `npm install`
   - 環境変数の設定
   - アプリケーションのビルド: `npm run build`

3. **サービス設定**:
   - PM2またはsystemdでのプロセス管理設定
   - nginx等のリバースプロキシ設定
   - HTTPS証明書の設定

## 5. 実装優先順位

### フェーズ1: 基本機能実装
1. CSVファイルアップロードとパース処理
2. フィールドマッピングとインポート実行
3. インポート履歴と状態管理

### フェーズ2: カレンダー連携基本実装
1. Googleカレンダー認証とイベント取得
2. カレンダーイベントからの顧客データ抽出
3. iCloudカレンダー連携の基本実装

### フェーズ3: 抽出アルゴリズムの改善
1. より高度なイベント識別ロジック
2. 自然言語処理を用いた顧客データ抽出精度向上
3. 予約パターンの学習機能

### フェーズ4: 高度な機能
1. インポートテンプレートの保存と再利用
2. スマートマッピング（AIベースの項目推測）
3. 自動同期スケジューリングの最適化

## 6. フロントエンドUI設計

### 6.1 UXフロー
- 直感的なステップバイステップのウィザード形式
- 各ステップでの明確なフィードバック
- 処理中の状態表示（プログレスバー、パーセンテージ）
- エラー発生時の明確な通知と対処方法の提示

### 6.2 カレンダー連携設定画面
- カレンダー選択と視覚的な表示
- 予約イベント識別パターンの設定（例示付き）
- 抽出ルールのテスト機能（サンプルイベントでの実演）
- 定期的な同期スケジュール設定

### 6.3 顧客データマッピング画面
- カレンダーイベントのフィールドと顧客データフィールドの直感的マッピング
- 抽出ルールのプレビュー機能
- カスタムルール作成支援（正規表現ビルダーなど）

## 7. 今後の拡張性

### 7.1 機能拡張の可能性
- AIベースのカレンダーイベント解析
- 複数カレンダーの統合ビュー
- インポートデータの事前クリーニング機能
- 自動予約情報通知システム（四柱推命アドバイス付き）

### 7.2 その他カレンダーサービスとの連携
- Microsoft Outlook/Office 365カレンダー
- Yahoo!カレンダー
- 業界特化型予約システム用のコネクタ（将来的な拡張）