# チームメンバー権限モデル改善実装計画

## 概要

チームメンバーシップに階層的な権限モデル（creator, admin, member）を導入し、より柔軟かつセキュアなチーム管理を実現します。

## 実装済み項目

### 1. データモデル更新
- TeamMembershipモデルにmemberRoleフィールドを追加（値：creator, admin, member）
- 既存のisAdminフィールドとの互換性を維持

### 2. 権限チェック機能の統一
- 権限チェックヘルパー関数の作成：`checkTeamPermission(userId, teamId, action)`
- TeamContextに権限チェックメソッドの追加：`hasTeamPermission(action, teamId?)`

### 3. サーバー側の実装
- 各チームメンバーシップ作成・更新APIでmemberRoleの設定を追加
- 既存データ用のマイグレーションスクリプトを作成

## 実行すべき作業

### 1. マイグレーションの実行
```
node scripts/migrate-team-memberships.js
```

### 2. フロントエンド側の権限利用
- 各コンポーネントで`useTeam()`からhasTeamPermissionを呼び出して権限チェックを行う
- 管理アクション要素（編集・削除ボタンなど）を条件付きレンダリングする

### 3. 実装テスト項目
- 既存チームの作成者が正しく「creator」ロールに設定されているか
- 既存の管理者が正しく「admin」ロールに設定されているか
- 各権限レベル（creator, admin, member）のユーザーが適切な操作を実行できるか
- 権限がないユーザーが制限された操作を実行できないようになっているか

## 備考

- この実装は後方互換性を維持しているため、既存の機能を損なうことなく新しい権限モデルを段階的に導入できます
- マイグレーションスクリプトは冪等性があり、複数回実行しても安全です
- 将来的にはisAdminフィールドを非推奨にし、memberRoleのみの利用に移行してコードを簡略化することを検討してください