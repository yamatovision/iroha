# TypeScript エラー解消計画

## 現状の問題

現在、チームメンバーシップリファクタリングの途中段階にあり、205件のTypeScriptエラーが存在しています。これらは主に以下のカテゴリに分類されます：

1. `user.teamId` と `user.teamRole` への参照 (User モデルから削除されたフィールド)
2. 型の不一致 (TS2769)
3. プロパティ存在確認エラー (TS2339)
4. null/undefined チェックの不足 (TS18048)
5. 型が不明なプロパティの使用 (TS18046)

## 解決アプローチ

### フェーズ1: 古いフィールド参照の修正

1. **TeamMembershipモデルを活用**:
   - `user.teamId` → `TeamMembership.findOne({ userId })`
   - `user.teamRole` → `membership.role`

2. **ヘルパー関数の実装**:
   ```typescript
   // ユーザーのチーム所属を確認する関数
   export const isTeamMember = async (teamId: string, userId: string): Promise<boolean> => {
     const membership = await TeamMembership.findOne({ teamId, userId });
     return !!membership;
   }

   // ユーザーのデフォルトチームを取得する関数
   export const getDefaultTeamId = async (userId: string): Promise<string | null> => {
     const membership = await TeamMembership.findOne({ userId }).sort({ joinedAt: -1 });
     return membership?.teamId?.toString() || null;
   }

   // ユーザーのチーム内役割を取得する関数
   export const getUserTeamRole = async (userId: string, teamId: string): Promise<string> => {
     const membership = await TeamMembership.findOne({ userId, teamId });
     return membership?.role || '';
   }
   ```

### フェーズ2: 型定義の強化

1. **AuthRequest インターフェースの修正**:
   ```typescript
   // 現在の定義
   export interface AuthRequest extends Request {
     user?: {
       id: string;
       email: string;
       role: UserRole;
       organizationId?: string;
     };
   }

   // 修正後の定義
   export interface AuthRequest extends Request {
     user?: {
       id: string;
       _id: string; // id と _id の両方をサポート
       email: string;
       role: UserRole;
       organizationId?: string;
       [key: string]: any; // その他の属性も許容
     };
   }
   ```

2. **Nullチェックの追加**:
   - オプショナルチェイニング (`?.`) の一貫した使用
   - Nullish合体演算子 (`??`) の活用
   - 明示的な型アサーションの使用 (`as`)

### フェーズ3: モデル間の一貫性確保

1. **TeamMembershipモデルと既存モデルの連携**:
   - 結合クエリの最適化
   - モデル変換ヘルパーの実装

2. **型キャスト処理の追加**:
   ```typescript
   // 型安全なキャスト
   const teamId = team._id as mongoose.Types.ObjectId;
   ```

## 実装計画

### ステップ1: チーム関連サービスの修正

1. **team.service.ts**:
   - `user.teamId` への参照をすべて `TeamMembership` 参照に置き換え
   - `isTeamMember` 関数の完全実装

2. **team-member.service.ts**:
   - メンバー取得/追加ロジックの修正
   - `teamRole` → `role` への変更

### ステップ2: コントローラの修正

1. **チームメンバーコントローラ**:
   - メンバーシップデータの適切な構造化
   - 型アサーションの追加

2. **運勢コントローラ**:
   - チームメンバーシップチェックの新方式への移行
   - チーム運勢ランキング機能の更新

### ステップ3: 友達関係機能の統合

1. **Friendship モデルの活用**:
   - Null チェックの徹底
   - 適切な型定義

2. **インターフェース標準化**:
   - 各APIエンドポイントでの一貫した型の使用
   - 共通レスポンス形式の確立

## テスト計画

1. 各フェーズ後に `npx tsc --noEmit` を実行してエラー数の減少を確認
2. Unit テストの追加・更新
3. 機能テストでのリグレッションチェック

## 優先度

1. 構文エラー (claude-ai.ts) ✅ 完了
2. チームメンバーシップモデルの参照整合性
3. クリティカルな型エラーの修正
4. 警告レベルのエラー対応

## タイムライン

- フェーズ1: 〜2025/04/25
- フェーズ2: 〜2025/04/30
- フェーズ3: 〜2025/05/05

## 終了条件

- `npx tsc --noEmit` でエラーが0件
- 友達機能のフロントエンド実装の準備完了
- リファクタリングの一貫した完了

## 注意点

1. 後方互換性に注意する
2. 一度に大きな変更を避け、段階的に修正
3. 適切なコミットメッセージでの変更履歴管理