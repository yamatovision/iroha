/**
 * 格局・用神データ修正スクリプト
 * 既存ユーザーの格局(kakukyoku)と用神(yojin)データを修正します
 */

// 必要なモジュールのインポート
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { SajuEngine } = require('../../sajuengine_package/dist');

// 環境変数を読み込み
dotenv.config();

// MongoDBの接続設定
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

// データを整形して保存するヘルパー関数
async function cleanupKakukyokuYojinData(userId) {
  try {
    // UserモデルをMongoDBコレクションから直接取得
    const userCollection = mongoose.connection.collection('users');
    
    // ユーザー情報を取得
    const user = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    
    if (!user) {
      console.log(`ユーザーID ${userId} が見つかりません`);
      return false;
    }
    
    if (!user.birthDate || !user.birthTime || !user.birthPlace || !user.gender) {
      console.log(`ユーザーID ${userId} のサジュ計算に必要な情報が不足しています`);
      return false;
    }
    
    console.log(`ユーザー "${user.displayName}" (${user.email}) のデータを処理中...`);
    
    // SajuEngineを初期化
    const sajuEngine = new SajuEngine({
      useInternationalMode: true,
      useLocalTime: true
    });
    
    // 出生時間を分解
    const [hours, minutes] = user.birthTime.split(':').map(Number);
    const birthDate = new Date(user.birthDate);
    
    // 四柱推命を計算
    const result = sajuEngine.calculate(
      birthDate,
      hours + (minutes / 60),
      user.gender,
      user.birthPlace,
      user.birthplaceCoordinates
    );
    
    // kakukyokuとyojinデータを抽出
    const { kakukyoku, yojin } = result;
    
    // ログ出力
    console.log('計算結果:');
    console.log('格局(kakukyoku):', kakukyoku ? {
      type: kakukyoku.type,
      category: kakukyoku.category,
      strength: kakukyoku.strength
    } : 'なし');
    
    console.log('用神(yojin):', yojin ? {
      tenGod: yojin.tenGod,
      element: yojin.element,
      supportElements: yojin.supportElements
    } : 'なし');
    
    // 更新データ
    const updateData = {};
    
    if (kakukyoku) {
      updateData.kakukyoku = {
        type: kakukyoku.type,
        category: kakukyoku.category,
        strength: kakukyoku.strength,
        description: kakukyoku.description
      };
    }
    
    if (yojin) {
      updateData.yojin = {
        tenGod: yojin.tenGod,
        element: yojin.element,
        description: yojin.description,
        supportElements: yojin.supportElements,
        kijin: yojin.kijin || {},
        kijin2: yojin.kijin2 || {},
        kyujin: yojin.kyujin || {}
      };
    }
    
    // データを更新
    if (Object.keys(updateData).length > 0) {
      const updateResult = await userCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { $set: updateData }
      );
      
      console.log(`ユーザーID ${userId} のデータを更新しました`);
      return true;
    } else {
      console.log(`ユーザーID ${userId} の更新データはありません`);
      return false;
    }
    
  } catch (error) {
    console.error(`ユーザーID ${userId} の処理中にエラーが発生しました:`, error);
    return false;
  }
}

// メイン実行関数
async function main() {
  try {
    console.log('格局・用神データ修正ツールを開始します...');
    
    // データベースに接続
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDBに接続しました');
    
    // ユーザーコレクションを取得
    const userCollection = mongoose.connection.collection('users');
    
    // 全ユーザーを取得
    const users = await userCollection.find({}).toArray();
    console.log(`総ユーザー数: ${users.length}`);
    
    // 処理カウンター
    let processedCount = 0;
    let updatedCount = 0;
    
    // 各ユーザーのkakukyokuとyojinデータを修正
    for (const user of users) {
      processedCount++;
      console.log(`\n[${processedCount}/${users.length}] ユーザー "${user.displayName}" (${user.email}) を処理中...`);
      
      const updated = await cleanupKakukyokuYojinData(user._id.toString());
      if (updated) updatedCount++;
    }
    
    console.log(`\n処理完了: ${processedCount}人中${updatedCount}人のデータを更新しました`);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    // データベース接続を閉じる
    await mongoose.disconnect();
    console.log('データベース接続を閉じました');
  }
}

// スクリプトを実行
main();