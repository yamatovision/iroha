// debug-team-context-fortune.js
require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function checkTeamContextFortune() {
  try {
    // MongoDBに接続
    console.log('MongoDBに接続中...');
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI}`);
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'dailyfortune'
    });
    console.log('MongoDB接続成功');
    
    // TeamContextFortuneモデルの定義
    const teamContextFortuneSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      teamId: mongoose.Schema.Types.ObjectId,
      date: Date,
      dayPillarId: mongoose.Schema.Types.ObjectId,
      teamGoalId: mongoose.Schema.Types.ObjectId,
      score: Number,
      teamContextAdvice: String,
      collaborationTips: [String],
      createdAt: Date,
      updatedAt: Date
    });
    
    const TeamContextFortune = mongoose.model('TeamContextFortune', teamContextFortuneSchema);
    
    // 最新のデータを検索
    const results = await TeamContextFortune.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`\n検索結果: ${results.length}件\n`);
    
    if (results.length === 0) {
      console.log('データが見つかりませんでした。');
      return;
    }
    
    // 結果の詳細表示
    for (const fortune of results) {
      console.log('\n--- チームコンテキスト運勢データ ---');
      console.log(`ID: ${fortune._id}`);
      console.log(`ユーザーID: ${fortune.userId}`);
      console.log(`チームID: ${fortune.teamId}`);
      console.log(`日付: ${fortune.date}`);
      console.log(`スコア: ${fortune.score}`);
      
      console.log('\n--- teamContextAdvice (全文) ---');
      console.log(fortune.teamContextAdvice);
      
      console.log('\n--- collaborationTips (協力ヒント) ---');
      fortune.collaborationTips.forEach((tip, i) => {
        console.log(`\n協力ヒント ${i+1}:`);
        console.log(tip);
      });
      
      // Claude APIのレスポンスを解析して3つのセクションに分割してみる
      console.log('\n--- Claude APIレスポンスの解析 ---');
      const paragraphs = fortune.teamContextAdvice.split('\n\n').filter(p => p.trim());
      
      console.log(`\n分割されたパラグラフ数: ${paragraphs.length}`);
      
      paragraphs.forEach((p, i) => {
        console.log(`\n段落 ${i+1}:`);
        console.log(p);
      });
      
      // 仮定された3セクション分割
      if (paragraphs.length >= 3) {
        console.log('\n--- 3セクションに分割した場合 ---');
        console.log('\nセクション1: チームコンテキストにおける運勢');
        console.log(paragraphs[0]);
        
        console.log('\nセクション2: チーム目標達成のための具体的アドバイス');
        console.log(paragraphs[1]);
        
        console.log('\nセクション3: チーム内での役割発揮のポイント');
        console.log(paragraphs[2]);
      }
    }
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    // MongoDB接続を閉じる
    await mongoose.connection.close();
    console.log('\nMongoDB接続終了');
  }
}

console.log('チームコンテキスト運勢デバッグスクリプト開始');
checkTeamContextFortune();