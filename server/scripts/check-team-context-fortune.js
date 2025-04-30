/**
 * チームコンテキスト運勢データの検証スクリプト
 * このスクリプトは、データベースに保存されているチームコンテキスト運勢データを分析し、
 * 想定する構造と内容になっているかを検証します。
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function checkTeamContextFortune() {
  try {
    console.log('MongoDB接続を試みています...');
    await mongoose.connect(process.env.MONGODB_URI);
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
    
    // 最新のデータを取得（最大5件）
    const results = await TeamContextFortune.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`検索結果件数: ${results.length}`);
    
    if (results.length === 0) {
      console.log('チームコンテキスト運勢データが見つかりませんでした。');
      return;
    }
    
    // 各結果の分析
    results.forEach((fortune, index) => {
      console.log(`\n=== チームコンテキスト運勢 ${index + 1} ===`);
      console.log(`ID: ${fortune._id}`);
      console.log(`ユーザーID: ${fortune.userId}`);
      console.log(`チームID: ${fortune.teamId}`);
      console.log(`日付: ${fortune.date}`);
      console.log(`スコア: ${fortune.score}`);
      
      // teamContextAdviceの分析
      console.log(`\n--- teamContextAdvice フィールド分析 ---`);
      if (!fortune.teamContextAdvice) {
        console.log('警告: teamContextAdviceフィールドが空です');
      } else {
        console.log(`長さ: ${fortune.teamContextAdvice.length} 文字`);
        console.log(`内容のサンプル: ${fortune.teamContextAdvice.substring(0, 200)}...`);
        
        // Markdownヘッダーの検出
        const headers = [
          '# 本日のチーム運勢',
          '## チームコンテキストにおける運勢',
          '## チーム目標達成のための具体的アドバイス',
          '## チーム内での役割発揮のポイント'
        ];
        
        console.log('\nヘッダー検出:');
        headers.forEach(header => {
          const found = fortune.teamContextAdvice.includes(header);
          console.log(`  ${header}: ${found ? '✅ 見つかりました' : '❌ 見つかりません'}`);
        });
        
        // セクションの抽出と分析
        const sections = fortune.teamContextAdvice.split(/^## /m);
        console.log(`\n分割されたセクション数: ${sections.length}`);
        
        if (sections.length > 1) {
          // タイトルを除いた最初のセクション
          const titlePart = sections[0].split('\n\n')[0];
          console.log(`\nタイトル: ${titlePart.trim()}`);
          
          // 各セクションの長さ
          for (let i = 1; i < sections.length; i++) {
            const sectionText = sections[i].trim();
            const sectionTitle = sectionText.split('\n')[0];
            const sectionContent = sectionText.substring(sectionTitle.length).trim();
            console.log(`\nセクション ${i}:`);
            console.log(`  タイトル: ${sectionTitle}`);
            console.log(`  内容の長さ: ${sectionContent.length} 文字`);
            console.log(`  サンプル: ${sectionContent.substring(0, 100)}...`);
          }
        }
      }
      
      // collaborationTipsの分析
      console.log(`\n--- collaborationTips フィールド分析 ---`);
      console.log(`項目数: ${fortune.collaborationTips.length}`);
      fortune.collaborationTips.forEach((tip, i) => {
        console.log(`  ${i+1}. 長さ: ${tip.length} 文字${tip.length > 0 ? `, サンプル: ${tip.substring(0, 100)}...` : ''}`);
      });
    });
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB接続を閉じました');
  }
}

// スクリプト実行
checkTeamContextFortune();