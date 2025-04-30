const mongoose = require('mongoose');
const { enhancedCompatibilityService } = require('./dist/services/team/enhanced-compatibility.service');
require('dotenv').config();

async function testEnhancedCompatibility() {
  try {
    // MongoDB接続 - 環境変数から接続情報を取得
    const MONGODB_URI = process.env.MONGODB_URI;
    const DB_NAME = process.env.DB_NAME || 'dailyfortune';
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI環境変数が設定されていません');
    }
    
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });
    console.log('MongoDB接続成功');

    // 拡張相性診断サービスの呼び出し
    console.log('拡張相性診断を実行');
    const result = await enhancedCompatibilityService.getOrCreateEnhancedCompatibility(
      '67f87e86a7d83fb995de0ee6',  // Tatsuya
      '67f87e86a7d83fb995de0ee7'   // あみ
    );

    // enhancedDetailsの確認
    console.log('拡張相性詳細情報:');
    if (result.enhancedDetails) {
      console.log(JSON.stringify(result.enhancedDetails, null, 2));
    } else {
      console.log('enhancedDetailsが存在しません');
    }

    // その他の情報の確認
    console.log('\n基本情報:');
    console.log(`- 相性スコア: ${result.compatibilityScore}`);
    console.log(`- 関係タイプ: ${result.relationshipType}`);
    console.log(`- relationship: ${result.relationship}`);

    // 切断
    await mongoose.disconnect();
    console.log('MongoDB切断');
  } catch (error) {
    console.error('テストエラー:', error);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // 切断エラーは無視
    }
  }
}

// テスト実行
testEnhancedCompatibility();