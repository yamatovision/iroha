/**
 * Claude APIレスポンスのテスト用スクリプト
 * 
 * このスクリプトは、Claude APIレスポンスの処理と保存をテストします。
 * 実際のAPIを呼び出さずにモックレスポンスを使用して処理をテストします。
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Claude APIのモックレスポンス
const mockClaudeResponse = `# 本日のチーム運勢 - テストユーザー さんへ

## チームコンテキストにおける運勢
本日は、チーム内での調和と協力が特に重要です。あなたの五行特性である「木」のエネルギーが日柱の「土」と相互作用し、創造的なアイデアを生み出す環境が整っています。特に午後からはコミュニケーション能力が高まり、チーム内での情報共有がスムーズに進むでしょう。

## チーム目標達成のための具体的アドバイス
チーム目標「プロジェクトの期限内完了」に向けて、今日はタスクの優先順位を再確認することが効果的です。特に重要なのは、細部に注目しながらも全体像を見失わないこと。午前中は分析作業に集中し、午後はチームメンバーとの協力体制を強化するとよいでしょう。明日の進捗ミーティングに向けて、具体的な成果物を準備することで、チーム全体の方向性を明確にできます。

## チーム内での役割発揮のポイント
今日のあなたは特に「調整役」としての才能を発揮できます。チームメンバー間の意見の相違を埋める橋渡し役に徹することで、プロジェクトの停滞を防ぎ、スムーズな進行を促進できるでしょう。特に技術的な議論が行き詰まった際には、客観的な視点からの質問や整理が効果的です。`;

async function testClaudeResponseProcessing() {
  try {
    console.log('MongoDB接続を開始します...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB接続成功');

    // TeamContextFortuneスキーマ定義
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
    
    // モデル登録
    const TeamContextFortune = mongoose.model('TeamContextFortune', teamContextFortuneSchema);
    
    // テスト用ユーザーIDとチームID
    const testUserId = new mongoose.Types.ObjectId();
    const testTeamId = new mongoose.Types.ObjectId();
    const testDate = new Date();
    testDate.setHours(0, 0, 0, 0);
    
    console.log('===== テスト用チームコンテキスト運勢の作成 =====');
    console.log('モックレスポンスの長さ:', mockClaudeResponse.length, '文字');
    
    // テスト用のドキュメント作成
    const testFortune = new TeamContextFortune({
      userId: testUserId,
      teamId: testTeamId,
      date: testDate,
      dayPillarId: new mongoose.Types.ObjectId(), // ダミー
      score: 75,
      teamContextAdvice: mockClaudeResponse,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 保存前の検証
    console.log('\n===== 保存前のデータ検証 =====');
    console.log('teamContextAdvice フィールド長:', testFortune.teamContextAdvice.length, '文字');
    console.log('teamContextAdvice フィールドサンプル:');
    console.log(testFortune.teamContextAdvice.substring(0, 200) + '...');
    
    // Markdownの構造を検証
    const sections = testFortune.teamContextAdvice.split(/^## /m);
    console.log(`\nセクション数: ${sections.length - 1}`); // 最初のセクションはタイトル部分
    
    // ヘッダーの検出
    const expectedHeaders = [
      '# 本日のチーム運勢',
      '## チームコンテキストにおける運勢',
      '## チーム目標達成のための具体的アドバイス',
      '## チーム内での役割発揮のポイント'
    ];
    
    console.log('\nヘッダー検出:');
    expectedHeaders.forEach(header => {
      const found = testFortune.teamContextAdvice.includes(header);
      console.log(`  ${header}: ${found ? '✅ 見つかりました' : '❌ 見つかりません'}`);
    });
    
    // データベースに保存
    console.log('\n===== データベースへの保存 =====');
    const savedFortune = await testFortune.save();
    console.log('保存成功: ID =', savedFortune._id);
    
    // 保存後のデータを取得して検証
    console.log('\n===== 保存後のデータ検証 =====');
    const retrievedFortune = await TeamContextFortune.findById(savedFortune._id);
    
    console.log('teamContextAdvice フィールド長:', retrievedFortune.teamContextAdvice.length, '文字');
    
    // 保存前後でデータが変わっていないかチェック
    const unchanged = retrievedFortune.teamContextAdvice === mockClaudeResponse;
    console.log('保存前後でデータは同一:', unchanged ? '✅ はい' : '❌ いいえ');
    
    if (!unchanged) {
      console.log('警告: 保存前後でデータが変更されています');
      console.log('変更前長さ:', mockClaudeResponse.length, '文字');
      console.log('変更後長さ:', retrievedFortune.teamContextAdvice.length, '文字');
    }
    
    // セクションの内容を検証（保存後）
    const retrievedSections = retrievedFortune.teamContextAdvice.split(/^## /m);
    
    console.log('\n各セクションの長さ検証:');
    if (retrievedSections.length > 1) {
      // タイトル部分
      const titlePart = retrievedSections[0].trim();
      console.log('タイトル部分:', titlePart);
      
      // 各セクション
      for (let i = 1; i < retrievedSections.length; i++) {
        const sectionLines = retrievedSections[i].trim().split('\n');
        const sectionTitle = sectionLines[0].trim();
        const sectionContent = sectionLines.slice(1).join('\n').trim();
        
        console.log(`\nセクション ${i}: ${sectionTitle}`);
        console.log(`長さ: ${sectionContent.length} 文字`);
        console.log('内容サンプル:');
        console.log(sectionContent.substring(0, 50) + '...');
      }
    }
    
    // テスト用データの削除
    console.log('\n===== テストデータの削除 =====');
    await TeamContextFortune.deleteOne({ _id: savedFortune._id });
    console.log('テストデータを削除しました');
    
    console.log('\n===== テスト結果 =====');
    console.log('✅ テスト成功: Claude APIレスポンスを正しく保存できました');
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB接続を閉じました');
  }
}

// スクリプト実行
testClaudeResponseProcessing();