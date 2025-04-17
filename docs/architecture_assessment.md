# DailyFortune アーキテクチャ評価レポート

## 1. 現状分析

### 1.1 プロジェクト構造

現在のプロジェクトは従来的なMVC（Model-View-Controller）パターンに近い構造で実装されています：

```
server/
├── src/
│   ├── config/              # 設定ファイル (Firebase, DB)
│   ├── controllers/         # コントローラー
│   │   ├── admin/           # 管理者向けコントローラー
│   │   └── auth.controller.ts
│   ├── middleware/          # ミドルウェア (認証, セキュリティ)
│   ├── models/              # MongooseモデルとSchema定義
│   ├── routes/              # APIルート定義
│   ├── tests/               # テスト
│   └── types/               # 型定義
└── scripts/                 # スクリプト
```

### 1.2 主要コンポーネント

#### 1.2.1 コントローラーの実装パターン

コントローラーは以下のパターンで実装されています：

- HTTPリクエスト処理、ビジネスロジック、データアクセスが単一の関数内に含まれる
- エラーハンドリングはtry-catchブロックで実装
- 認証情報はミドルウェアから `req.user` として受け取る

**典型的な実装例：**
```typescript
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', role, plan, search } = req.query;
    
    // パラメータ処理
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // フィルタリング条件構築
    const filter: any = {};
    if (role) { filter.role = role; }
    
    // データベースアクセス
    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);
    
    // レスポンス返却
    return res.status(200).json({
      users,
      pagination: { /* ページネーション情報 */ }
    });
  } catch (error) {
    console.error('エラー:', error);
    return res.status(500).json({ message: 'エラーメッセージ' });
  }
};
```

#### 1.2.2 データアクセスパターン

- MongooseモデルをコントローラーDirect接続で使用
- リポジトリ層は存在せず、クエリロジックがコントローラーに直接記述
- 複雑なクエリは動的にフィルター条件を構築して実現

**データアクセス例：**
```typescript
// フィルター構築
const filter: any = {};
if (startDate || endDate) {
  filter.date = {};
  if (startDate) { filter.date.$gte = new Date(startDate as string); }
  if (endDate) {
    const endDateTime = new Date(endDate as string);
    endDateTime.setHours(23, 59, 59, 999);
    filter.date.$lte = endDateTime;
  }
}

// クエリ実行
const logs = await DailyFortuneUpdateLog.find(filter)
  .sort({ date: -1, startTime: -1 })
  .skip(skip)
  .limit(limitNumber);
```

#### 1.2.3 ドメインロジック

コアとなる四柱推命計算や運勢生成ロジックは以下のように実装されています：

- `sajuengine_package`として独立したパッケージで計算エンジンを実装
- `SajuProfile`モデルがユーザーの四柱推命情報を保存
- `DailyFortune`モデルが日々の運勢情報を保存
- `DailyFortuneUpdateLog`が運勢更新プロセスを記録

しかし、**実際の運勢生成ロジックは現状では未実装**で、コメントのみが記述されています：

```typescript
// 運勢更新実行部分（未実装）
export const runFortuneUpdate = async (req: AuthRequest, res: Response) => {
  try {
    // ...前処理...
    
    // 新しい運勢更新ログを作成
    const newLog = new DailyFortuneUpdateLog({
      date: updateDate,
      status: 'scheduled',
      startTime: new Date(),
      totalUsers: targetUserIds ? targetUserIds.length : 0,
      successCount: 0,
      failedCount: 0,
      isAutomaticRetry: false,
      createdBy: new mongoose.Types.ObjectId(req.user.uid)
    });
    
    await newLog.save();
    
    // 実際の運勢生成処理はバックグラウンドジョブで実行
    // TODO: 実際のジョブ実行処理を実装
    
    return res.status(200).json({
      message: '運勢更新ジョブを開始しました',
      jobId: newLog._id,
      startTime: newLog.startTime,
      status: newLog.status
    });
  } catch (error) {
    // ...エラー処理...
  }
};
```

#### 1.2.4 テスト実装

- Jestフレームワークを使用
- MongoDBインメモリデータベースでテスト実行
- モデルテストが中心（バリデーション、メソッドのテスト）
- API統合テストは限定的

**典型的なテスト例：**
```typescript
it('必須フィールドを指定して有効な運勢更新ログを保存できること', async () => {
  const validData = createValidUpdateLog();
  const savedLog = await saveUpdateLog(validData);

  // データが正しく保存されたか検証
  expect(savedLog._id).toBeDefined();
  expect(savedLog.date).toEqual(validData.date);
  expect(savedLog.status).toEqual(validData.status);
  // ...その他の検証...
});
```

## 2. 強みと課題

### 2.1 強み

1. **明確なディレクトリ構造**: 責務ごとにファイルが整理されている
2. **型安全性**: TypeScriptを活用した型付け
3. **詳細なモデル定義**: Mongooseスキーマで詳細な型とバリデーションを定義
4. **モジュール化**: 関連機能ごとにコントローラーが分離されている
5. **テスト基盤**: 基本的なテスト環境は整備されている

### 2.2 課題

1. **ビジネスロジックの混在**: コントローラーにデータアクセスとビジネスロジックが混在
2. **サービス層の欠如**: 再利用可能なビジネスロジックの抽象化がない
3. **リポジトリ層の欠如**: データアクセスパターンが分散している
4. **テストカバレッジ**: APIエンドポイントやサービスレベルのテストが不足
5. **エラーハンドリング**: 各コントローラーで個別に実装されている
6. **核となるロジック**: 運勢生成ロジックなど、一部のコア機能が未実装

## 3. 改善提案

### 3.1 サービス層の導入（最優先）

**現状**:
```
コントローラー → モデル
```

**改善後**:
```
コントローラー → サービス → モデル
```

**実装例**:
```typescript
// services/user.service.ts
export class UserService {
  async getUsers(options: UserListOptions): Promise<UserListResult> {
    const { page, limit, role, plan, search } = options;
    
    // フィルタリングロジック
    const filter = this.buildUserFilter(role, plan, search);
    
    // データ取得ロジック
    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return {
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit)
      }
    };
  }
  
  private buildUserFilter(role?: string, plan?: string, search?: string): any {
    // フィルタービルドロジック
  }
}

// controllers/admin/users.controller.ts
export const getUsers = async (req: Request, res: Response) => {
  try {
    const userService = new UserService();
    const result = await userService.getUsers({
      page: parseInt(req.query.page as string || '1', 10),
      limit: parseInt(req.query.limit as string || '20', 10),
      role: req.query.role as string,
      plan: req.query.plan as string,
      search: req.query.search as string
    });
    
    return res.status(200).json(result);
  } catch (error) {
    // エラー処理
  }
};
```

### 3.2 リポジトリパターンの導入（段階的に）

データアクセスを抽象化し、再利用可能なパターンとして実装します。

```typescript
// repositories/user.repository.ts
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return User.findById(id);
  }
  
  async findWithFilters(filters: UserFilters, pagination: PaginationOptions): Promise<User[]> {
    const { skip, limit } = pagination;
    const query = this.buildQuery(filters);
    
    return User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
  
  async countWithFilters(filters: UserFilters): Promise<number> {
    const query = this.buildQuery(filters);
    return User.countDocuments(query);
  }
  
  private buildQuery(filters: UserFilters): any {
    // クエリビルドロジック
  }
}
```

### 3.3 ドメインロジックの分離（四柱推命計算エンジン特化）

四柱推命計算や運勢生成などの核となるロジックをドメインレイヤーに分離します。

```typescript
// domain/saju/SajuProfile.ts
export class SajuProfile {
  private readonly fourPillars: FourPillars;
  
  constructor(birthData: BirthData) {
    // sajuengine_packageを利用した四柱計算
    this.fourPillars = calculateFourPillars(birthData);
  }
  
  calculateDailyFortune(dayPillar: DayPillar): FortuneResult {
    // 日柱との相性計算
    const compatibility = calculateCompatibility(this.fourPillars, dayPillar);
    
    // 運勢スコア計算
    const score = this.calculateFortuneScore(compatibility);
    
    // アドバイス生成
    const advice = this.generateAdvice(compatibility, score);
    
    return {
      score,
      advice,
      luckyItems: this.determineLuckyItems(compatibility)
    };
  }
  
  // 内部メソッド
  private calculateFortuneScore(compatibility: Compatibility): number {
    // スコア計算ロジック
  }
  
  private generateAdvice(compatibility: Compatibility, score: number): string {
    // アドバイス生成ロジック
  }
  
  private determineLuckyItems(compatibility: Compatibility): LuckyItems {
    // ラッキーアイテム決定ロジック
  }
}
```

## 4. 実装ロードマップ

### 4.1 最優先事項

1. **サービス層の導入**
   - 主要な機能ごとにサービスクラスを作成
   - コントローラーからビジネスロジックを移動
   - 共通エラーハンドリングの導入

### 4.2 中期的な改善

1. **四柱推命関連のドメインモデル整備**
   - SajuProfileドメインクラスの実装
   - 運勢計算ロジックの明確化
   - sajuengine_packageとの連携強化

2. **テストカバレッジ向上**
   - サービス層のユニットテスト追加
   - API統合テストの拡充
   - E2Eテストの導入

### 4.3 長期的な改善

1. **リポジトリパターン導入**
   - データアクセスの抽象化
   - クエリビルダーパターンの導入
   - トランザクション管理の改善

2. **クリーンアーキテクチャへの段階的移行**
   - 依存性の方向制御
   - ユースケース中心の設計
   - インターフェースによる依存性の抽象化

## 5. まとめ

DailyFortuneプロジェクトは基本的な構造が整っていますが、ビジネスロジックとデータアクセスの分離が不十分です。サービス層の導入を最優先事項として、段階的にアーキテクチャを改善していくことで、保守性、拡張性、テスト容易性を向上させることができます。

特に、四柱推命計算や運勢生成などのコアロジックをドメインレイヤーとして明確に分離することで、アプリケーションの本質的な価値を高め、技術的な実装詳細から独立させることができます。