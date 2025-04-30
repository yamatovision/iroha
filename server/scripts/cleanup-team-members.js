/**
 * チームデータから非推奨の members フィールドを削除するスクリプト
 * リファクタリング計画に基づいた第3フェーズの実装用
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数を読み込む
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// MongoDB接続URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

if (!MONGODB_URI) {
  console.error('MongoDB接続URIが設定されていません');
  process.exit(1);
}

// MongoDBに接続
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB 接続成功');

    // Teamモデル定義（スキーマを明示的に定義）
    const teamSchema = new mongoose.Schema({
      name: String,
      adminId: mongoose.Schema.Types.Mixed,
      organizationId: mongoose.Schema.Types.ObjectId,
      description: String,
      iconInitial: String,
      iconColor: String,
      members: [{ 
        userId: mongoose.Schema.Types.Mixed,
        role: String,
        joinedAt: Date
      }]
    }, { timestamps: true });
    
    // モデルが既に存在する場合は再利用、そうでない場合は新規作成
    const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);

    try {
      // すべてのチームを取得して情報を表示
      const teamsCount = await Team.countDocuments();
      console.log(`データベース内のチーム数: ${teamsCount}`);
      
      // すべてのチームからmembersフィールドを削除
      const result = await Team.updateMany(
        {},
        { $unset: { members: 1 } }
      );
      
      // 結果オブジェクトをデバッグ出力
      console.log('Update result:', JSON.stringify(result, null, 2));

      // MongoDB 4.2以降と以前でレスポンス形式が異なるため両方に対応
      const modifiedCount = result.modifiedCount !== undefined ? result.modifiedCount : result.nModified;
      const matchedCount = result.matchedCount !== undefined ? result.matchedCount : result.n;

      console.log(`${modifiedCount} 件のチームデータを更新しました`);
      console.log(`${matchedCount} 件のチームデータがマッチしました`);
      console.log('データクリーンアップが完了しました');
    } catch (error) {
      console.error('データクリーンアップ中にエラーが発生しました:', error);
    } finally {
      // MongoDBとの接続を閉じる
      await mongoose.connection.close();
      console.log('MongoDB 接続を閉じました');
    }
  })
  .catch(err => {
    console.error('MongoDB 接続エラー:', err);
    process.exit(1);
  });