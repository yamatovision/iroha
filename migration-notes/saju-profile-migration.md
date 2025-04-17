# SajuProfile 削除と User モデルへの統合に関するメモ

## 概要

DailyFortune アプリケーションでは、元々四柱推命プロフィール (SajuProfile) を独立したモデルとして管理していましたが、データの統合と簡素化のため、この情報を User モデルに統合することになりました。

このドキュメントは、そのプロセスとユーザーへの影響をまとめたものです。

## 主な変更点

1. `SajuProfile` モデルを `User` モデルに完全に統合
2. APIエンドポイントを `/saju-profiles/*` から `/users/*` へ移行
3. 共有型定義とAPIパス定義を更新 (`SAJU_PROFILE` → `SAJU` + `USER`)

## 移行完了項目

### バックエンド

- [x] `server/src/index.ts` から SajuProfile ルーターの参照を削除
- [x] `server/src/models/index.ts` から SajuProfile モデルのエクスポートを削除
- [x] `shared/index.ts` の API パス定義を更新:
  - `SAJU_PROFILE` を `SAJU` に置き換え (共通ユーティリティのみ)
  - `USER` に四柱推命関連のエンドポイントを追加
- [x] `IUser` インターフェースに四柱推命関連のフィールドを追加
- [x] 後方互換性のために `ISajuProfile` インターフェイスを維持

### フロントエンド

- [x] `saju-profile.service.ts` を更新:
  - SAJU_PROFILE の参照を SAJU に変更
  - ユーティリティ API (都市情報など) の参照を更新
  - User API へのリダイレクトを実装

## 未完了項目

### バックエンド

- [ ] `server/src/services/saju-profile.service.ts` を削除または非推奨化
- [ ] `server/src/controllers/saju-profile.controller.ts` を削除または非推奨化
- [ ] `server/src/routes/saju-profile.routes.ts` を削除または非推奨化
- [ ] モデル定義 `server/src/models/SajuProfile.ts` の削除
- [ ] データベースから物理的に SajuProfile コレクションを削除（`saju-profile-migration.ts` でプルガ可能）

### フロントエンド

- [ ] フロントエンドの他の箇所で `saju-profile.service.ts` を使用している箇所の対応

## データ移行

実際の環境では、SajuProfile コレクションにデータが存在しておらず、既に User モデルに四柱推命データが直接保存されていることが確認されました。このため、データ移行作業は基本的に不要です。

ただし、念のため `server/scripts/saju-profile-migration.ts` スクリプトを作成して、もし SajuProfile コレクションに残存データがある場合の移行処理と、コレクションの安全な削除を実行できるようにしています。

## 移行スクリプトの使用方法

```bash
# 現在の状態を確認（データ変更なし）
npx ts-node server/scripts/saju-profile-migration.ts --check

# データ移行を実行（SajuProfile → User）
npx ts-node server/scripts/saju-profile-migration.ts --migrate

# 安全確認後、SajuProfile コレクションを削除
npx ts-node server/scripts/saju-profile-migration.ts --purge
```

## 後方互換性について

移行期間中は後方互換性を保つため以下の対応を実施しています：

1. `ISajuProfile` インターフェースを引き続き提供 (ただし実際のデータは `User` モデル内に存在)
2. フロントエンドの `saju-profile.service.ts` は維持して、内部で `User` APIにリダイレクト
3. 古いAPIパスは使用されなくなったものの、機能的には維持（プロフィール管理など）

## 備考

今回の変更により、アプリケーションのデータ構造がより一貫性を持ち、APIリクエスト数も削減されます。また、四柱推命データが User モデルに直接格納されることで、ユーザー情報の一元管理が容易になります。