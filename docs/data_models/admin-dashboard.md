# 管理者ダッシュボードのデータモデル設計

## 概要

管理者ダッシュボードは美容サロン全体の運営状況を一目で把握するためのページです。予約数、クライアント数、スタイリスト数などの基本統計情報と、GPT-4oトークン使用状況を表示します。

## 必要なデータモデル

### 1. ダッシュボード統計情報 (`DashboardStats`)

```typescript
interface DashboardStats {
  // 基本統計情報
  todayAppointments: number;          // 本日の予約数
  clientsCount: number;               // 全クライアント数
  stylistsCount: number;              // スタイリスト数
  weeklyCompletedServices: number;    // 今週の施術完了数
  
  // 未担当予約情報
  unassignedAppointments: UnassignedAppointment[];  // 本日の未担当予約リスト
}

interface UnassignedAppointment {
  id: string;                 // 予約ID
  clientId: string;           // クライアントID
  clientName: string;         // クライアント名
  serviceType: string;        // 施術内容
  timeSlot: {                 // 予約時間枠
    start: string;            // 開始時間 (ISO 8601形式)
    end: string;              // 終了時間 (ISO 8601形式)
  };
  elementType: 'water' | 'wood' | 'fire' | 'earth' | 'metal';  // クライアントの五行タイプ
  assigned: boolean;          // 担当者割り当て済みかどうか
}
```

### 2. トークン使用統計 (`TokenUsageStats`)

```typescript
interface TokenUsageStats {
  // 月間使用量サマリー
  currentPeriod: {
    usedTokens: number;         // 現在の使用トークン数
    totalTokens: number;        // プラン上限トークン数
    usagePercentage: number;    // 使用率（%）
    remainingTokens: number;    // 残りトークン数
    planLimit: number;          // プラン上限
    renewalDate: string;        // 更新日 (ISO 8601形式)
  };
  
  // 日別トークン使用量（チャート用）
  dailyUsage: {
    date: string;              // 日付 (YYYY-MM-DD形式)
    tokenCount: number;        // その日のトークン使用量
  }[];
  
  // 日割り目安ライン（チャート用）
  dailyTarget: number;         // 一日あたりの目安トークン数
}
```

### 3. ユーザー権限情報（表示内容制御用）

```typescript
interface UserRole {
  role: 'owner' | 'admin' | 'user';   // ユーザーロール
  permissions: string[];              // 権限リスト
}
```

## エンティティ間の関連

1. **ユーザー/スタイリスト ⟷ トークン使用統計**
   - 各スタイリストのトークン使用量が `TokenUsageLog` テーブルに記録され、それを集計して組織全体の使用量が算出される

2. **予約 ⟷ 未担当予約情報**
   - 予約テーブルから当日分かつ未割り当て（スタイリストIDがnull）のものを抽出

3. **クライアント ⟷ 未担当予約情報**
   - 各予約はクライアントIDで紐付き、クライアント情報から名前や五行属性を取得

## データフロー

1. **ダッシュボード読み込み時**:
   - クライアントはAPIを呼び出し、`DashboardStats`と`TokenUsageStats`を取得
   - バックエンドはMongoDBから各種統計情報を集計して返却
   - トークン使用量は日次で集計されたデータから取得

2. **未担当予約の割り当て時**:
   - 予約データが更新され、担当スタイリストIDが設定される
   - ダッシュボードの未担当予約リストからも該当予約が除外される

3. **トークン使用時**:
   - GPT-4oへのAPIリクエスト時にトークン使用ログが記録される
   - バックエンドで日次・組織別に集計される
   - ダッシュボードのトークン使用統計が更新される

## 潜在的なデータ整合性の問題

1. **リアルタイム性**:
   - トークン使用量の更新には若干の遅延が発生する可能性がある
   - 複数スタイリストが同時に利用した場合、最新の使用量がすぐに反映されない可能性
   - 解決策: 定期的な自動更新機能の実装と更新時刻の表示

2. **予約の状態変化**:
   - 予約が取り消しや変更された際の未担当予約リストへの反映
   - 解決策: Pub/Subパターンによるリアルタイム更新通知

## 状態遷移フロー

### トークン使用量の状態遷移

1. **通常状態** (使用率 < 80%)
   - 標準的な表示、警告なし

2. **警告状態** (使用率 80% ~ 95%)
   - 視覚的な警告表示
   - ユーザーに節約または追加チャージを促すメッセージ

3. **危険状態** (使用率 > 95%)
   - 赤色の強調表示
   - トークン追加チャージの強い推奨メッセージ

4. **上限到達状態** (使用率 >= 100%)
   - API機能の一部制限
   - 追加チャージボタンの強調表示