# 運勢データ一貫性向上計画書

## 現状の運勢生成ロジックの仕組み

現在のシステムでは、以下のようなフローで運勢データが生成・管理されています：

1. **クライアント側**：
   - ホーム画面(/fortune)でマウント時に日付変更をチェック
   - 日付が変わっていたらデータ再取得フラグを設定
   - ユーザープロファイルロード後に`fetchDashboard()`を実行し、運勢データを取得
   - `fortuneService.getFortuneDashboard()`を呼び出して統合データを取得
   - キャッシュ機能があり、キャッシュ期限は1時間または日付変更時

2. **サーバー側**：
   - `DailyFortune`コレクションにユーザーID×日付で運勢データを保存
   - `getUserFortune()`で指定日付の運勢データを取得、ない場合は新規生成
   - MongoDB上で`userId`と`date`の組み合わせにユニーク制約があり

## 問題点

1. **日付とタイムゾーンの扱い**：
   - クライアントのタイムゾーン情報に基づいて「今日」が計算される
   - 異なるタイムゾーン設定のデバイスでは異なる「今日」として扱われる可能性
   - これにより同じユーザーでも異なるデバイスで異なる運勢が生成される可能性がある

2. **キャッシュ整合性**：
   - 各デバイスが独自にクライアントキャッシュを持つ
   - デバイス間でのキャッシュの一貫性が保証されていない

3. **運勢再生成の条件**：
   - サーバー側で運勢が見つからない場合は常に新規生成する
   - 日付の解釈の違いによって不要な再生成が行われる可能性がある

## 改善案

1. **サーバー側で日付管理を一元化**：
   - クライアントから送信されるタイムゾーン情報を受け取り、サーバー側で一貫した日付処理を行う
   - サーバー側で特定ユーザーの特定日の運勢データが既に存在するかを必ず確認し、あれば返す
   - 運勢データが存在しない場合のみ新規生成する

2. **データモデルの最適化**：
   - `userId`と`date`の組み合わせによる一意性制約を維持
   - 日付はUTC形式で標準化して保存
   - クライアントのタイムゾーン情報を適切に処理してクエリする

3. **キャッシュ戦略の改善**：
   - HTTPキャッシュヘッダー（ETag、Last-Modified）を活用
   - サーバーサイドでの有効期限管理
   - クライアント側のキャッシュロジックを簡素化

4. **ID管理の一貫性向上**：
   - ユーザーID管理を整理し、確実な識別方法に統一

## 実装変更案

具体的には以下のような変更が考えられます：

1. サーバー側の`getUserFortune`関数を修正：
```typescript
public async getUserFortune(userId: string, date?: Date, timezone: string = 'Asia/Tokyo'): Promise<any> {
  // タイムゾーンを考慮した「今日」の日付を計算
  const targetDate = date || this.calculateLocalDate(new Date(), timezone);
  
  // 日付の範囲をUTC基準で設定（0時〜24時）
  const dateStart = new Date(targetDate);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(dateStart);
  dateEnd.setDate(dateEnd.getDate() + 1);
  
  // 指定された日付の運勢データを検索
  const fortune = await DailyFortune.findOne({
    userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId,
    date: {
      $gte: dateStart,
      $lt: dateEnd
    }
  }).populate('dayPillarId');
  
  // 運勢データが見つかった場合はそれを返す
  if (fortune) {
    return {
      // データマッピング...
    };
  }
  
  // 見つからない場合のみ新規生成
  return this.generateFortune(userId, targetDate, false, timezone);
}
```

2. フォーチュンコントローラーの`getDailyFortune`でのタイムゾーン処理を強化：
```typescript
public async getDailyFortune(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    // タイムゾーン情報を統一的に取得
    const timezone = req.query.timezone as string || 'Asia/Tokyo';
    const tzOffset = parseInt(req.query.tzOffset as string || '-540', 10);
    
    // ...既存のコード...
    
    // 日付またはタイムゾーンを考慮した今日の運勢を取得
    const fortune = await fortuneService.getUserFortune(userId, targetDate, timezone);
    
    // ...レスポンス返却...
  } catch (error) {
    // ...エラーハンドリング...
  }
}
```

## 期待される成果

これらの変更により、以下の成果が期待できます：

1. デバイスごとに運勢が再生成される問題が解決される
2. ユーザーは異なるデバイスからアクセスしても同じ日の運勢を見ることができる
3. サーバーリソースの効率的な利用（不要な運勢生成の削減）
4. タイムゾーンの違いによる不整合の解消
5. キャッシュ管理の改善によるパフォーマンス向上

## 実装順序

1. サーバー側の日付処理関連の関数を修正
2. `getUserFortune`関数の改修
3. コントローラーのタイムゾーン処理強化
4. キャッシュ戦略の最適化
5. クライアント側のキャッシュロジック簡素化

## テスト計画

1. 異なるタイムゾーン設定での運勢データ取得テスト
2. 複数デバイスでの同時アクセステスト
3. 日付変更境界でのテスト
4. パフォーマンス比較テスト

これらの対応により、システム全体の一貫性とユーザー体験の向上が期待できます。