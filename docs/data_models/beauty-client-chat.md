# 美容クライアントチャットのデータモデル設計

## 概要

このドキュメントでは、美容クライアント専用チャット機能のためのデータモデル設計について説明します。この機能は、美容師が特定のクライアント（お客様）に対して、四柱推命情報に基づいたパーソナライズされた美容アドバイスを提供するためのものです。

## エンティティ関連図

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │       │                 │
│  Organization   │───┐   │      User       │───┐   │    Client       │
│  (サロン)        │   │   │  (スタイリスト)  │   │   │  (お客様)       │
│                 │   │   │                 │   │   │                 │
└─────────────────┘   │   └─────────────────┘   │   └───────┬─────────┘
                     │                        │           │
                     │                        │           │
                     │                        │           │
                     │   ┌─────────────────┐  │           │
                     └───┤                 │  │           │
                         │ BeautyClientChat│  │           │
                         │ (クライアントチャット)│◄─┘           │
                         │                 │◄─────────────┘
                         └────────┬────────┘
                                  │
                                  │
                                  │
                         ┌────────▼────────┐
                         │                 │
                         │ ChatMessage     │
                         │ (チャットメッセージ) │
                         │                 │
                         └─────────────────┘
```

## データモデル詳細

### 1. BeautyClientChat（クライアント専用チャット）

クライアントごとのチャットセッションを表すモデルです。

```typescript
export interface IBeautyClientChat {
  id: mongoose.Types.ObjectId;        // チャットID
  organizationId: mongoose.Types.ObjectId; // サロン組織ID
  clientId: mongoose.Types.ObjectId;  // クライアントID
  lastMessageAt: Date;                // 最終メッセージ日時
  tokenCount: number;                 // 累積トークン使用量
  aiModel: string;                    // 使用AIモデル（例: 'gpt-4o'）
  contextData: {                      // コンテキストデータ
    sajuProfile?: {                   // 四柱推命プロフィール
      fourPillars: {
        yearPillar: { stem: string; branch: string; hiddenStems?: string[] };
        monthPillar: { stem: string; branch: string; hiddenStems?: string[] };
        dayPillar: { stem: string; branch: string; hiddenStems?: string[] };
        hourPillar: { stem: string; branch: string; hiddenStems?: string[] };
      };
      kakukyoku?: {
        type: string;
        category: string;
        strength: string;
        description: string;
      };
      yojin?: {
        tenGod: string;
        element: string;
        description: string;
        supportElements: string[];
      };
      elementProfile: {
        wood: number;
        fire: number;
        earth: number;
        metal: number;
        water: number;
        mainElement: string;
        secondaryElement?: string;
      };
    };
    clientProfile?: {                 // クライアントプロフィール
      name: string;
      gender: 'M' | 'F';
      birthdate: string;
      birthtime?: string;
      preferences?: string[];
      hairType?: string;
      skinTone?: string;
    };
    visitHistory?: Array<{           // 施術履歴
      date: string;
      serviceType: string;
      stylistId: string;
      stylistName: string;
      notes?: string;
    }>;
    additionalNotes?: string[];      // 追加メモ
  };
  messages: IBeautyClientChatMessage[]; // チャットメッセージ配列
  createdAt: Date;                   // 作成日時
  updatedAt: Date;                   // 更新日時
}
```

**インデックス**:
- `organizationId` & `clientId` (複合インデックス)
- `lastMessageAt` (降順)
- `clientId`
- `tokenCount`

### 2. BeautyClientChatMessage（チャットメッセージ）

クライアントチャット内の個別メッセージを表すサブドキュメントモデルです。

```typescript
export interface IBeautyClientChatMessage {
  id?: mongoose.Types.ObjectId;       // メッセージID（サブドキュメント時はオプション）
  sender: 'user' | 'assistant';       // 送信者タイプ
  senderId?: mongoose.Types.ObjectId; // 送信者ID（userの場合）
  content: string;                    // メッセージ内容
  timestamp: Date;                    // タイムスタンプ
  tokenUsage?: {                      // トークン使用量
    prompt: number;                   // プロンプトトークン
    completion: number;               // レスポンストークン
    total: number;                    // 合計トークン
  };
  additionalContext?: {               // 追加コンテキスト
    visitPurpose?: string;            // 来店目的
    clientConcerns?: string[];        // クライアントの悩み
    seasonalEvent?: string;           // 季節イベント
    hairCondition?: string;           // 髪の状態
    dayPillar?: {                     // 当日の日柱情報
      heavenlyStem: string;
      earthlyBranch: string;
      hiddenStems: string[];
      energyDescription: string;
    };
  };
}
```

### 3. BeautyClient（美容クライアント）

サロンのクライアント（お客様）情報を表すモデルです。

```typescript
export interface IBeautyClient {
  id: mongoose.Types.ObjectId;         // クライアントID
  organizationId: mongoose.Types.ObjectId; // サロン組織ID
  name: string;                        // クライアント名
  gender: 'M' | 'F';                   // 性別
  birthdate: Date;                     // 生年月日
  birthtime?: string;                  // 出生時間（HH:MM形式）
  birthplace?: string;                 // 出生地
  contactInfo?: {                      // 連絡先情報
    phone?: string;
    email?: string;
    address?: string;
  };
  sajuProfileId?: mongoose.Types.ObjectId; // 四柱推命プロフィールID（関連付け）
  preferences?: {                      // 好み設定
    styles?: string[];                 // 好みのスタイル
    colors?: string[];                 // 好みの色
    avoidStyles?: string[];           // 避けたいスタイル
    avoidColors?: string[];           // 避けたい色
    specialRequests?: string[];       // 特別リクエスト
  };
  hairProfile?: {                      // 髪のプロフィール
    type: string;                      // 髪質タイプ
    condition: string;                 // 髪の状態
    length: string;                    // 髪の長さ
    colorHistory: string[];            // カラー履歴
    treatmentHistory: string[];        // トリートメント履歴
  };
  notes: Array<{                       // メモ
    content: string;
    createdAt: Date;
    createdBy: mongoose.Types.ObjectId;
    serviceType?: string;
  }>;
  visitHistory: Array<{                // 来店履歴
    date: Date;
    serviceType: string;
    stylistId: mongoose.Types.ObjectId;
    notes?: string;
    imageUrls?: string[];              // ビフォー/アフター画像
  }>;
  createdAt: Date;                     // 作成日時
  updatedAt: Date;                     // 更新日時
  externalIds?: {                      // 外部システムID
    hotpepperId?: string;              // ホットペッパーID
    salonAnswerId?: string;            // サロンアンサーID
    otherIds?: Record<string, string>; // その他システムID
  };
}
```

**インデックス**:
- `organizationId`
- `name`
- `contactInfo.phone`
- `contactInfo.email`
- `sajuProfileId`
- `visitHistory.date` (降順)

### 4. ClientNote（クライアントメモ）

クライアントに関するメモ情報を表すモデル（BeautyClientの一部としても保存）。

```typescript
export interface IClientNote {
  id: mongoose.Types.ObjectId;          // メモID
  clientId: mongoose.Types.ObjectId;    // クライアントID
  organizationId: mongoose.Types.ObjectId; // サロン組織ID
  content: string;                      // メモ内容
  serviceType?: string;                 // サービスタイプ
  createdBy: mongoose.Types.ObjectId;   // 作成者ID
  createdAt: Date;                      // 作成日時
  updatedAt: Date;                      // 更新日時
  isDeleted: boolean;                   // 削除フラグ
}
```

**インデックス**:
- `clientId`
- `organizationId`
- `createdAt` (降順)
- `serviceType`

### 5. 日柱データモデル（既存のDayPillarモデルを使用）

日柱情報は既存のDayPillarモデルを利用します。

```typescript
export interface IDayPillar {
  date: Date;                          // 日付
  heavenlyStem: string;                // 天干
  earthlyBranch: string;               // 地支
  hiddenStems: string[];               // 蔵干
  energyDescription: string;           // エネルギー説明
  createdAt: Date;                     // 作成日時
}
```

## データフロー

### クライアントチャット初期化フロー

1. ユーザー（スタイリスト）が施術予定クライアントを選択
2. システムがクライアント情報とSajuProfileを取得
3. 当日の日柱情報を取得（DayPillar）
4. BeautyClientChatモデルのインスタンスを検索または作成
5. コンテキストデータとして、SajuProfile、クライアント情報、日柱情報をセット
6. チャット履歴を取得し、専用チャットインターフェースを表示

### メッセージ送受信フロー

1. ユーザーがメッセージを送信
2. サーバーがメッセージをBeautyClientChatMessage形式で保存
3. AI処理のためのシステムメッセージを構築（四柱推命情報と当日の日柱情報を含む）
4. OpenAI APIを呼び出してレスポンスを取得
5. AI応答をBeautyClientChatMessageとして保存
6. トークン使用量を記録し、BeautyClientChatのtokenCountを更新
7. レスポンスをクライアントに返送（ストリーミングまたは一括）

### 来店日が変わった場合のフロー

1. ユーザーが過去のクライアントチャットにアクセス
2. システムが当日の日柱情報を新たに取得
3. システムメッセージの日柱情報部分のみを更新
4. チャット履歴はそのまま保持し、新しい日柱情報を元にAIが応答

## データ整合性と制約

1. **サロン組織の制約**:
   - BeautyClientChatはorganizationIdに紐づけられ、同一サロン内でのみアクセス可能
   - 異なるサロンのクライアントデータへのアクセスは制限される

2. **クライアントデータの整合性**:
   - BeautyClientChat作成時には、有効なクライアントIDが必要
   - クライアントが削除された場合、関連するチャットデータはアーカイブまたは匿名化

3. **トークン使用量の管理**:
   - サロンのサブスクリプションプランに基づいてトークン上限を設定
   - トークン使用量はリアルタイムで追跡され、上限に達した場合は制限が適用

4. **メッセージの保持期間**:
   - チャット履歴は基本的に永続保存
   - サロン管理画面から必要に応じて古いチャット履歴をアーカイブ可能

## データ更新戦略

1. **日柱情報の自動更新**:
   - 新しい日付のチャットセッションではその日の日柱情報を自動取得
   - 日柱更新はシステムメッセージのみ影響し、過去のメッセージには影響しない

2. **クライアント情報の更新**:
   - クライアント情報（名前、連絡先等）が更新された場合、関連するチャットのコンテキストデータも更新
   - 四柱推命情報（生年月日時）が更新された場合、新しく計算された情報でコンテキスト更新

3. **チャット履歴の永続化**:
   - メッセージは追加のみ可能（編集・削除は基本的に不可）
   - チャットセッションの削除は論理削除（isDeleted フラグ設定）として実装

## インデックス最適化

チャット履歴の検索と取得のパフォーマンスを最適化するために、以下のインデックスを設定します：

1. BeautyClientChat コレクション:
   - `{ organizationId: 1, clientId: 1 }` (複合インデックス)
   - `{ clientId: 1, lastMessageAt: -1 }` (複合インデックス、ソート用)
   - `{ organizationId: 1, lastMessageAt: -1 }` (複合インデックス、ソート用)

2. ClientNote コレクション:
   - `{ clientId: 1, createdAt: -1 }` (複合インデックス、クライアント別メモ取得用)
   - `{ organizationId: 1, createdAt: -1 }` (複合インデックス、サロン別メモ取得用)

これらのインデックスにより、クライアント別チャット検索、最新メッセージ順のソート、サロン別データ取得などの操作が高速化されます。

## データ移行計画

既存のChatHistoryモデルからBeautyClientChatモデルへの移行:

1. 既存のChatHistoryから美容クライアント関連のチャットをidentify
2. クライアントIDと関連情報に基づいて新モデルにデータをマイグレーション
3. コンテキストデータにSajuProfileと日柱情報を追加
4. 新しいインデックスを作成
5. テスト後、本番環境に段階的に展開

## 将来の拡張性

1. **マルチメディア対応**:
   - 将来的に画像添付機能を追加する可能性を考慮
   - メッセージモデルに`attachments`フィールドを予備として準備

2. **AI機能拡張**:
   - 複数のAIモデル（GPT-4o, Claude等）への対応
   - 機能別の特化モデル（スタイル提案、カラー提案等）

3. **統計・分析機能**:
   - 使用パターンや効果的な提案の分析のための統計データ収集
   - コンテキストデータに分析用のメタデータフィールドを追加