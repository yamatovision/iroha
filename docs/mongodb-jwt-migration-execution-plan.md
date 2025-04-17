# MongoDB ObjectID標準化・JWT認証移行実行計画

## 概要

本ドキュメントは、DailyFortuneアプリケーションにおけるFirebase UIDからMongoDB ObjectIDへの完全移行と、Firebase認証からJWT認証への迅速な移行を実行するための詳細プランです。現在、MongoDB（ObjectID型）とFirebase（文字列型UID）の混在によりエラーが頻発しており、特にチャット機能などで型の不一致問題が生じています。この移行計画により、一貫したデータモデルと認証システムを構築し、アプリケーションの安定性と保守性を大幅に向上させます。

## 目的

1. **MongoDB ObjectIDの完全標準化**
   - すべてのコレクションでObjectID型を一貫して使用
   - 文字列型UIDとObjectIDの混在を完全に解消
   - 型安全性を高め、バグとエラーを削減

2. **Firebase認証からJWT認証への完全移行**
   - 認証システムを内部実装に完全移行
   - Firebase SDKへの依存を排除
   - 認証とデータモデルの統一的な管理を実現

## 現状の問題点

1. **ID型の不一致と混在**
   - モデル定義: MongoDB ObjectID型で定義
   - 実際の使用: Firebase UID（文字列型）のまま使用
   - エラー例: `Cast to ObjectId failed for value "Bs2MacLtK1Z1fVnau2dYPpsWRpa2" (type string) at path "_id" for model "User"`

2. **認証システムの二重管理**
   - Firebase認証とJWT認証が共存
   - ハイブリッド認証による複雑さ
   - 関連データとの整合性維持が困難

## 実行計画

### フェーズ0: 準備作業（1日）

#### 0.1 現状の詳細分析
- [ ] Firebase UIDを使用している全コレクションの特定
- [ ] IDの参照関係のマッピング（どのコレクションがどのIDを参照しているか）
- [ ] 移行に必要なスクリプトの特定と計画

#### 0.2 バックアップとリストア手順の確認
- [ ] 完全バックアップの実施と検証
- [ ] リストア手順の確認と文書化
- [ ] ロールバック計画の策定

#### 0.3 開発環境の準備
- [ ] 移行用のブランチを作成
- [ ] テスト環境の構築
- [ ] CI/CDパイプラインの準備（必要に応じて）

### フェーズ1: データ移行の準備とコード更新（2日）

#### 1.1 ユーザーモデルの更新
- [ ] ユーザーモデルにObjectID型の_idを確実に設定
- [ ] firebaseUidフィールドの追加（移行期間中の互換性のため）
- [ ] JWT認証関連フィールドの追加（refreshToken, tokenVersion）

```typescript
// User.ts モデルの更新例
export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  displayName: string;
  // JWT認証関連
  refreshToken?: string;
  tokenVersion?: number;
  // 移行用の互換性フィールド
  firebaseUid?: string; // 既存のFirebase UIDを保持
  // 他のフィールド...
}

const userSchema = new Schema<IUserDocument>({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true
  },
  // 他のフィールド...
  firebaseUid: {
    type: String,
    index: true,
    sparse: true
  },
  // JWT認証関連フィールド
  refreshToken: {
    type: String,
    select: false
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
});
```

#### 1.2 関連コレクションのモデル更新
- [ ] ChatHistoryモデルの確認と調整
- [ ] TeamMemberCardモデルの確認と調整
- [ ] その他関連コレクションの確認と調整
- [ ] 全モデルでObjectID参照の一貫性を確保

#### 1.3 データアクセスサービスの修正
- [ ] UserServiceの更新（ID変換ロジックの追加）
- [ ] ChatServiceの更新（文字列型UIDとObjectIDの互換処理）
- [ ] 他のサービスクラスの更新

#### 1.4 マイグレーションスクリプトの作成

```typescript
// migration-script.ts
import { User } from '../models/User';
import { ChatHistory } from '../models/ChatHistory';
import { TeamMemberCard } from '../models/TeamMemberCard';
import mongoose from 'mongoose';

async function migrateFirebaseUidsToObjectIds() {
  // 既存のFirebase UIDを持つユーザーを取得
  const users = await User.find({});
  
  // ID変換マッピングを作成
  const idMappings = new Map();
  
  // 各ユーザーについて処理
  for (const user of users) {
    const oldId = user._id.toString();
    const firebaseUid = user.firebaseUid || oldId;
    
    // 新しいObjectIDを生成
    const newId = new mongoose.Types.ObjectId();
    
    // マッピングを保存
    idMappings.set(oldId, {
      newId,
      firebaseUid
    });
    
    // ユーザーのIDを更新
    user._id = newId;
    user.firebaseUid = firebaseUid; // 元のIDを保持
    await user.save();
  }
  
  // チャット履歴の更新
  await updateChatHistories(idMappings);
  
  // チームメンバーカードの更新
  await updateTeamMemberCards(idMappings);
  
  // その他の関連コレクションの更新
  // ...
  
  return {
    migrated: idMappings.size,
    mappings: Object.fromEntries(idMappings)
  };
}

async function updateChatHistories(idMappings) {
  // チャット履歴を更新
  for (const [oldId, { newId }] of idMappings.entries()) {
    await ChatHistory.updateMany(
      { userId: oldId },
      { $set: { userId: newId } }
    );
  }
}

// 他の更新関数...
```

### フェーズ2: JWTサービスとミドルウェアの実装（1日）

#### 2.1 JWTサービスの実装と検証
- [ ] JWTTokenServiceの実装
- [ ] トークン生成と検証のユニットテスト
- [ ] セキュリティレビュー（トークン有効期限、署名方式など）

#### 2.2 認証ミドルウェアの更新
- [ ] JWTミドルウェアの実装
- [ ] Firebase認証からの完全移行
- [ ] エラーハンドリングと適切なレスポンス設計

#### 2.3 ユーザー認証コントローラーの実装
- [ ] 登録（Register）エンドポイントの実装
- [ ] ログイン（Login）エンドポイントの実装
- [ ] トークンリフレッシュエンドポイントの実装
- [ ] ログアウトエンドポイントの実装

### フェーズ3: 実装と統合テスト（2日）

#### 3.1 マイグレーションスクリプトの実行
- [ ] テスト環境でのマイグレーション実行
- [ ] 結果の検証とエラー修正
- [ ] パフォーマンス最適化（必要に応じて）

#### 3.2 サービスとコントローラーの更新
- [ ] コントローラーでのID変換ロジックの削除
- [ ] サービス層でのID処理の一貫性確保
- [ ] ObjectID前提のクエリ最適化

#### 3.3 詳細なテスト
- [ ] ユニットテストの更新と実行
- [ ] 統合テストの実行
- [ ] エンドツーエンドテストの実行

### フェーズ4: フロントエンド対応とデプロイ（2日）

#### 4.1 フロントエンドの認証コード更新
- [ ] AuthContextの更新
- [ ] JWT認証フローの実装
- [ ] トークン管理機能の実装（保存、リフレッシュなど）

#### 4.2 APIサービスの更新
- [ ] API呼び出しでのトークン管理
- [ ] エラーハンドリングの拡張
- [ ] 再試行と認証リフレッシュの実装

#### 4.3 デプロイ準備
- [ ] 最終テストの実施
- [ ] デプロイスクリプトの準備
- [ ] ロールバック手順の確認

#### 4.4 デプロイ実行
- [ ] 実行時間帯の計画（トラフィックの少ない時間）
- [ ] バックアップの作成
- [ ] デプロイの実行と検証

## 詳細な実装計画

### 1. MongoDB ObjectID標準化

#### ChatHistoryモデルの修正

ChatHistoryモデルでユーザーIDの型を適切に処理するための修正：

```typescript
// ChatHistory.ts

// インターフェースの修正 - 移行期間中は柔軟な型を許容
export interface IChatHistory {
  userId: mongoose.Types.ObjectId | string; // 移行期間中は両方を許容
  // 他のフィールド...
}

// スキーマの修正 - ObjectIDと文字列の両方を受け入れる設定
const chatHistorySchema = new Schema<IChatHistoryDocument>({
  userId: {
    type: Schema.Types.Mixed, // 移行期間中はMixed型
    required: [true, 'ユーザーIDは必須です'],
    index: true
  },
  // 他のフィールド...
});

// インデックスの更新
chatHistorySchema.index({ userId: 1, chatType: 1 });

// 事前検証フック - 移行後はObjectID型のみ許容
chatHistorySchema.pre('validate', function(next) {
  const userId = this.userId;
  // 文字列型の場合はObjectIDへの変換を試みる
  if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
    this.userId = new mongoose.Types.ObjectId(userId);
  }
  next();
});
```

#### ChatServiceの修正

Chat Serviceのユーザー検索ロジックを修正：

```typescript
// chat.service.ts

// ユーザーの検索処理を改善
public async findUserById(userId: string): Promise<any> {
  try {
    // 1. ObjectIDとして検索
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const userById = await User.findById(new mongoose.Types.ObjectId(userId));
      if (userById) return userById;
    }
    
    // 2. Firebase UIDとして検索
    const userByFirebaseUid = await User.findOne({ firebaseUid: userId });
    if (userByFirebaseUid) return userByFirebaseUid;
    
    // 3. Legacy uid検索
    const userByLegacyUid = await User.findOne({ uid: userId });
    if (userByLegacyUid) return userByLegacyUid;
    
    // ユーザーが見つからない場合
    return null;
  } catch (error) {
    console.error('User search error:', error);
    throw error;
  }
}

// streamMessageメソッドの修正
public async *streamMessage(userId: string, message: string, mode: ChatMode, contextInfo?: any): AsyncGenerator<string, { chatHistory: IChatHistoryDocument }, unknown> {
  try {
    // ユーザー情報の取得（改善版）
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }
    
    // チャット履歴の取得
    let chatHistory = await this.getOrCreateChatSession(
      user._id.toString(), // ObjectIDを文字列に変換して一貫性を確保
      mode, 
      contextInfo, 
      user.plan === 'elite' ? 'sonnet' : 'haiku'
    );
    
    // 残りの処理は同様...
  } catch (error) {
    console.error('Chat streaming service error:', error);
    throw error;
  }
}
```

### 2. JWT認証の実装

#### JWTサービスの拡張

```typescript
// jwt.service.ts

import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

// 環境変数とデフォルト値
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'dailyfortune_access_token_secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'dailyfortune_refresh_token_secret';
const ACCESS_TOKEN_EXPIRY = '15m';  // 短めの有効期限
const REFRESH_TOKEN_EXPIRY = '7d';  // 長めの有効期限

export class JwtService {
  
  /**
   * アクセストークンの生成
   */
  static generateAccessToken(user: any): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion || 0
    };
    
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
  }
  
  /**
   * リフレッシュトークンの生成
   */
  static generateRefreshToken(user: any): string {
    const payload = {
      sub: user._id.toString(),
      tokenVersion: user.tokenVersion || 0
    };
    
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY
    });
  }
  
  /**
   * アクセストークンの検証
   */
  static verifyAccessToken(token: string): { valid: boolean; payload?: any; error?: any } {
    try {
      const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error };
    }
  }
  
  /**
   * リフレッシュトークンの検証
   */
  static verifyRefreshToken(token: string): { valid: boolean; payload?: any; error?: any } {
    try {
      const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error };
    }
  }
  
  /**
   * トークンからユーザーIDを取得
   */
  static getUserIdFromToken(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as { sub?: string };
      return decoded?.sub || null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Firebase UIDからJWT対応ユーザーを検索
   */
  static async findUserByFirebaseUid(firebaseUid: string): Promise<any> {
    return User.findOne({ firebaseUid });
  }
}
```

#### 認証ミドルウェアの実装

```typescript
// jwt-auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/jwt.service';
import { User } from '../models/User';
import mongoose from 'mongoose';

// 認証済みリクエスト型定義
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

// 認証不要パスの定義
const PUBLIC_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh-token',
  // 他の公開パス...
];

/**
 * JWT認証ミドルウェア
 */
export const jwtAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 公開パスはスキップ
  if (PUBLIC_PATHS.includes(req.path)) {
    return next();
  }
  
  try {
    // トークンの取得
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;
    
    // クエリパラメータからのトークン取得（SSE用）
    const queryToken = req.query.token as string | undefined;
    
    if (!token && !queryToken) {
      return res.status(401).json({ message: '認証トークンがありません' });
    }
    
    // トークン検証
    const verification = JwtService.verifyAccessToken(token || queryToken as string);
    
    if (!verification.valid) {
      return res.status(401).json({ message: '無効なトークンです' });
    }
    
    // ユーザーIDの取得
    const userId = verification.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: 'トークンにユーザーIDがありません' });
    }
    
    // ユーザー情報の取得
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }
    
    // トークンバージョンの検証
    if (user.tokenVersion !== undefined && 
        verification.payload.tokenVersion !== undefined &&
        user.tokenVersion > verification.payload.tokenVersion) {
      return res.status(401).json({ 
        message: 'トークンバージョンが無効です', 
        code: 'TOKEN_VERSION_INVALID' 
      });
    }
    
    // ユーザー情報をリクエストに添付
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      // 他の必要なフィールド...
    };
    
    next();
  } catch (error) {
    console.error('JWT認証エラー:', error);
    return res.status(401).json({ message: '認証に失敗しました' });
  }
};
```

### 移行スクリプト

#### Firebase UIDからObjectIDへの変換スクリプト

```typescript
// firebase-to-objectid-migration.ts

import mongoose from 'mongoose';
import { User } from '../models/User';
import { ChatHistory } from '../models/ChatHistory';
import { TeamMemberCard } from '../models/TeamMemberCard';

/**
 * Firebase UIDからObjectIDへの移行を実行
 */
export async function migrateFirebaseUidToObjectId() {
  console.log('Firebase UID → ObjectID 移行を開始...');
  
  // 移行ログの準備
  const migrationLog = {
    startTime: new Date(),
    usersMigrated: 0,
    chatHistoriesMigrated: 0,
    teamMemberCardsMigrated: 0,
    errors: [] as string[],
    idMappings: {} as Record<string, string>
  };
  
  try {
    // 全ユーザー取得
    const users = await User.find({});
    console.log(`${users.length}人のユーザーが見つかりました`);
    
    // ID変換マッピングの作成
    const idMappings = new Map<string, mongoose.Types.ObjectId>();
    
    // ユーザーごとの処理
    for (const user of users) {
      try {
        const oldId = user._id.toString();
        
        // すでにObjectIDの場合はスキップ
        if (mongoose.Types.ObjectId.isValid(oldId) && oldId.length === 24) {
          console.log(`ユーザー ${oldId} は既にObjectID形式です。スキップします。`);
          continue;
        }
        
        // 新しいObjectIDを生成
        const newId = new mongoose.Types.ObjectId();
        
        // マッピングを保存
        idMappings.set(oldId, newId);
        migrationLog.idMappings[oldId] = newId.toString();
        
        // Firebase UIDを保持
        user.firebaseUid = oldId;
        
        // 新しいIDを設定
        await User.updateOne({ _id: oldId }, { 
          $set: { 
            _id: newId,
            firebaseUid: oldId
          } 
        });
        
        migrationLog.usersMigrated++;
        console.log(`ユーザー ${oldId} → ${newId} の移行が完了`);
      } catch (error) {
        console.error(`ユーザー${user._id}の処理中にエラー:`, error);
        migrationLog.errors.push(`ユーザー${user._id}: ${error}`);
      }
    }
    
    // チャット履歴の更新
    if (idMappings.size > 0) {
      console.log('チャット履歴の更新中...');
      for (const [oldId, newId] of idMappings.entries()) {
        const result = await ChatHistory.updateMany(
          { userId: oldId },
          { $set: { userId: newId } }
        );
        
        migrationLog.chatHistoriesMigrated += result.modifiedCount;
        console.log(`ユーザー ${oldId} のチャット履歴 ${result.modifiedCount} 件を更新`);
      }
    }
    
    // チームメンバーカードの更新
    if (idMappings.size > 0) {
      console.log('チームメンバーカードの更新中...');
      for (const [oldId, newId] of idMappings.entries()) {
        const result = await TeamMemberCard.updateMany(
          { userId: oldId },
          { $set: { userId: newId } }
        );
        
        migrationLog.teamMemberCardsMigrated += result.modifiedCount;
        console.log(`ユーザー ${oldId} のチームメンバーカード ${result.modifiedCount} 件を更新`);
      }
    }
    
    // 移行ログの完了
    migrationLog.endTime = new Date();
    migrationLog.durationMs = migrationLog.endTime.getTime() - migrationLog.startTime.getTime();
    
    console.log('移行完了!', {
      usersMigrated: migrationLog.usersMigrated,
      chatHistoriesMigrated: migrationLog.chatHistoriesMigrated,
      teamMemberCardsMigrated: migrationLog.teamMemberCardsMigrated,
      durationMs: migrationLog.durationMs,
      errors: migrationLog.errors.length
    });
    
    // ログファイルの保存
    const fs = require('fs');
    fs.writeFileSync(
      `firebase-to-objectid-migration-${new Date().toISOString()}.json`,
      JSON.stringify(migrationLog, null, 2)
    );
    
    return migrationLog;
  } catch (error) {
    console.error('移行中にエラーが発生:', error);
    
    // エラーログの保存
    migrationLog.endTime = new Date();
    migrationLog.durationMs = migrationLog.endTime.getTime() - migrationLog.startTime.getTime();
    migrationLog.errors.push(`全体エラー: ${error}`);
    
    const fs = require('fs');
    fs.writeFileSync(
      `firebase-to-objectid-migration-error-${new Date().toISOString()}.json`,
      JSON.stringify(migrationLog, null, 2)
    );
    
    throw error;
  }
}
```

## リスク管理

### リスク要因と対策

| リスク | 影響度 | 対策 |
|------|------|------|
| データ損失 | 高 | 完全バックアップの実施と検証。移行前・移行中・移行後のデータ整合性チェック。 |
| サービス中断 | 中 | 利用者の少ない深夜帯にデプロイ。迅速な実行計画の遵守。 |
| 移行エラー | 中 | 詳細なログ記録。自動・手動ロールバック手順の準備。 |
| フロントエンド互換性 | 高 | APIレスポンス形式の維持。段階的な移行とテスト。 |
| バッチ処理エラー | 中 | バッチ処理の事前テストと監視。 |

### ロールバック計画

1. **データベースのロールバック**
   - 移行前のデータベースバックアップからの復元
   - インデックスとスキーマの復元確認

2. **コードのロールバック**
   - 移行前のコードブランチへの切り替え
   - サーバー再起動とサービス確認

3. **フロントエンドのロールバック**
   - 前バージョンへのロールバック
   - キャッシュのクリア方法の提供（必要に応じて）

## 移行成功基準

1. **すべてのデータが正しく移行されている**
   - ユーザー数の一致
   - 関連データの参照整合性の保持
   - マイグレーションエラーの欠如

2. **認証機能が正常に動作する**
   - 既存ユーザーによるログイン成功
   - トークン生成と更新の正常動作
   - 認証セッションの維持

3. **主要機能の正常動作**
   - チャット機能の正常動作
   - チーム機能の正常動作
   - バッチ処理の正常実行

4. **パフォーマンス基準の維持**
   - レスポンス時間の維持または改善
   - エラー率の減少
   - CPU/メモリ使用率の安定性

## 実施スケジュール

| 日付 | フェーズ | 主な作業内容 | 担当者 |
|------|---------|-------------|-------|
| Day 1 | フェーズ0 | 現状分析、バックアップ、準備作業 | 全員 |
| Day 2-3 | フェーズ1 | モデル更新、サービス修正、マイグレーションスクリプト作成 | バックエンド |
| Day 4 | フェーズ2 | JWT実装、ミドルウェア更新 | バックエンド |
| Day 5-6 | フェーズ3 | マイグレーション実行、テスト | QA、バックエンド |
| Day 7-8 | フェーズ4 | フロントエンド対応、デプロイ | フロントエンド、インフラ |

## まとめ

本実行計画は、MongoDB ObjectIDへの完全標準化とJWT認証への移行を迅速かつ安全に実施するためのものです。明確な責任分担、詳細な手順、リスク対策により、サービスへの影響を最小限に抑えながら移行を完了させます。移行後は、型の一貫性が高まり、エラーの削減とコードの簡素化が実現され、アプリケーションの安定性と開発効率の大幅な向上が期待できます。