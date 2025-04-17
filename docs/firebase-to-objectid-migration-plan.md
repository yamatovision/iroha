# Firebase UIDからObjectIDへの迅速移行計画（2025年4月11日）

## 概要

このドキュメントは、Firebase認証からJWT認証への迅速な完全移行と、すべてのFirebase UIDをMongoDB ObjectIDに置き換えるための計画を説明します。既存ユーザーは少数（2名）のテストユーザーのみであり、データの保持は必須ではないため、最も効率的で迅速な方法を採用します。

## 目的

1. Firebase認証から完全にJWT認証に切り替える
2. すべてのコレクションで一貫してMongoDBのObjectIDを使用する
3. Firebase依存を完全に排除し、データモデルを簡素化する
4. 可能な限り迅速に移行を完了させる

## 現状分析（2025年4月11日時点）

1. **ユーザーID形式**
   - User._id: 文字列型のFirebase UID形式（例：`Bs2MacLtK1Z1fVnau2dYPpsWRpa2`）
   
2. **関連コレクション**
   - TeamMemberCard: MongoDB ObjectID型の_idだが、userIdはFirebase UID（文字列）
   - ChatHistory: MongoDB ObjectID型の_idだが、userIdはFirebase UID（文字列）

3. **ユーザー数**
   - 実質的にテストユーザー2名のみ

## 迅速移行計画

### フェーズ1: 準備作業（1日）

1. **現状のデータをバックアップ**
   - MongoDB全コレクションのエクスポート

2. **新規JWT認証コードの実装**
   - JWTによるユーザー認証・認可システムを実装
   - ユーザーモデルにパスワードとJWTトークン関連フィールドを追加

3. **ObjectID型モデルへの変更**
   - すべてのモデルをObjectID型に統一
   - Mixed型は使用せず、完全にObjectID型に統一

### フェーズ2: クリーンアップと再構築（1日）

1. **既存データの削除**
   ```javascript
   // 既存データを一括削除
   db.users.deleteMany({});
   db.teammembercards.deleteMany({});
   db.chathistories.deleteMany({});
   // 必要に応じて他のコレクションも
   ```

2. **新規ユーザーの作成**
   ```javascript
   // ObjectIDを使用した新規ユーザー作成
   const newUsers = [
     {
       _id: new ObjectId(),
       email: "shiraishi.tatsuya@mikoto.co.jp",
       password: "<ハッシュ化されたパスワード>",
       displayName: "Tatsuya",
       role: "SuperAdmin"
     },
     {
       _id: new ObjectId(),
       email: "shiraishi.ami@mikoto.co.jp",
       password: "<ハッシュ化されたパスワード>",
       displayName: "あみ",
       role: "User"
     }
   ];
   
   db.users.insertMany(newUsers);
   ```

3. **テストデータの再作成**
   - 必要なテストデータのみを新規にObjectIDで作成
   - Firebase UIDへの参照を完全に排除

### フェーズ3: バックエンド実装の更新（1-2日）

1. **認証ミドルウェアの更新**
   - Firebase認証コードを完全に削除
   - JWT認証ミドルウェアに完全移行

2. **コントローラーとサービスの更新**
   - すべてのバックエンドコードでObjectIDを前提とした実装
   - Firebase関連のコードを完全に削除

3. **バッチ処理の最適化**
   - ObjectIDを前提としたクエリの簡素化
   - バッチ処理のパフォーマンス最適化

### フェーズ4: フロントエンド実装の更新（1-2日）

1. **認証コンテキストの更新**
   - Firebase認証関連コードを削除
   - JWT認証フローに完全移行

2. **APIサービスの更新**
   - すべてのAPIリクエストでJWTトークンを使用
   - Firebase関連SDKとコードを完全に削除

3. **UIコンポーネントの更新**
   - ログイン・登録フローの更新
   - 必要に応じてUIを調整

## テスト計画（1日）

1. **認証フローテスト**
   - 登録とログインのテスト
   - JWTトークンの有効期限と更新フローのテスト

2. **機能テスト**
   - チーム機能のテスト
   - チャット機能のテスト
   - その他の主要機能のテスト

3. **パフォーマンステスト**
   - バッチ処理の実行テスト
   - クエリ実行速度の確認

## 実装のポイント

### 1. ObjectID型への完全移行

```typescript
// ObjectID型のみを使用したスキーマ定義
userId: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: [true, 'ユーザーIDは必須です']
}
```

### 2. JWT認証の実装

```typescript
// JWT認証の基本実装
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('無効なトークンです');
  }
};
```

### 3. 認証ミドルウェア

```typescript
// JWTミドルウェアの実装
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: '認証に失敗しました' });
  }
};
```

## 実行スケジュール

| フェーズ | 作業内容 | 期間 | 担当 |
|-------|---------|------|------|
| 1.1 | データバックアップ | 0.5日 | エンジニア |
| 1.2 | JWT認証コード実装 | 0.5日 | エンジニア |
| 1.3 | ObjectID型モデル定義更新 | 1日 | エンジニア |
| 2.1 | 既存データ削除 | 0.5日 | エンジニア |
| 2.2 | 新規ユーザー作成 | 0.5日 | エンジニア |
| 2.3 | テストデータ再作成 | 1日 | エンジニア |
| 3 | バックエンド実装更新 | 1-2日 | エンジニア |
| 4 | フロントエンド実装更新 | 1-2日 | エンジニア |
| 5 | テスト実施 | 1日 | QA |

## メリット

1. **シンプルな実装**
   - 移行の複雑さを排除し、クリーンな実装が可能
   - 互換性維持のためのコードが不要

2. **開発効率の向上**
   - 型安全性の向上
   - コードの簡素化
   - エラー処理の簡略化

3. **メンテナンス性の向上**
   - 一貫したデータモデル
   - 依存関係の削減
   - コードベースの簡素化

## 注意点

1. **既存データの喪失**
   - すべての既存データが削除されるため、必要なデータは事前にバックアップ

2. **短期間のサービス停止**
   - 移行中は一時的にサービスが利用できなくなる可能性あり

3. **テスト環境のみで実施**
   - この計画は少数のテストユーザーのみが存在する環境を前提としている
   - 本番環境や多数のユーザーがいる環境では適さない

## まとめ

この迅速移行計画では、既存ユーザーとデータの保持に関する制約が少ないことを活用し、最短経路でFirebase認証からJWT認証への完全移行とObjectID標準化を実現します。これにより、より堅牢で保守性の高いアプリケーションアーキテクチャを短期間で構築できます。

全体の移行は約1週間程度で完了可能であり、移行後はFirebaseへの依存がなく、一貫したMongoDBベースのアーキテクチャとなります。