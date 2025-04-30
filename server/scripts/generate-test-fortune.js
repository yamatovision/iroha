// チームコンテキスト運勢生成テストスクリプト
require('dotenv').config();
const mongoose = require('mongoose');

async function generateTestFortune() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB接続成功');
    
    // 必要なモデルを手動で定義
    const teamContextFortuneSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      teamId: mongoose.Schema.Types.ObjectId,
      date: Date,
      dayPillarId: mongoose.Schema.Types.ObjectId,
      teamGoalId: mongoose.Schema.Types.ObjectId,
      score: Number,
      teamContextAdvice: String,
      createdAt: Date,
      updatedAt: Date
    });
    
    const TeamContextFortune = mongoose.model('TeamContextFortune', teamContextFortuneSchema);
    
    // サービスの動的インポート
    const { teamContextFortuneService } = require('../dist/services/team-context-fortune.service');
    
    // テスト用のパラメータ
    const userId = '67f87e86a7d83fb995de0ee6'; // テストユーザーID
    const teamId = '6805e8e7952f7bda054b4477'; // テストチームID
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    
    console.log('チームコンテキスト運勢を生成しています...');
    console.log(`ユーザーID: ${userId}`);
    console.log(`チームID: ${teamId}`);
    console.log(`日付: ${date.toISOString().split('T')[0]}`);
    
    // 既存のデータを確認
    const existingFortune = await TeamContextFortune.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      teamId: new mongoose.Types.ObjectId(teamId),
      date: {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (existingFortune) {
      console.log('既存のチームコンテキスト運勢が見つかりました:');
      console.log(`ID: ${existingFortune._id}`);
      console.log(`teamContextAdvice長さ: ${existingFortune.teamContextAdvice?.length || 0}文字`);
      
      // 既存データの削除
      console.log('既存データを削除します...');
      await TeamContextFortune.deleteOne({ _id: existingFortune._id });
      console.log('削除完了');
    }
    
    // 生成実行
    const startTime = Date.now();
    const fortune = await teamContextFortuneService.generateTeamContextFortune(userId, teamId, date);
    const endTime = Date.now();
    
    console.log(`生成完了 (${(endTime - startTime) / 1000}秒)`);
    console.log(`ID: ${fortune._id}`);
    console.log(`teamContextAdvice長さ: ${fortune.teamContextAdvice?.length || 0}文字`);
    
    // サンプル表示
    console.log('\nteamContextAdvice サンプル:');
    if (fortune.teamContextAdvice) {
      console.log(fortune.teamContextAdvice.substring(0, 200) + '...');
      
      // セクション分割
      const sections = fortune.teamContextAdvice.split(/^## /m);
      console.log(`\n${sections.length - 1}つのセクションを検出:`);
      
      for (let i = 1; i < sections.length; i++) {
        const sectionLines = sections[i].trim().split('\n');
        const sectionTitle = sectionLines[0].trim();
        console.log(`- セクション ${i}: ${sectionTitle} (${sectionLines.length}行)`);
      }
    }
    
  } catch (e) {
    console.error('エラー:', e);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB接続を閉じました');
  }
}

// スクリプト実行
generateTestFortune();