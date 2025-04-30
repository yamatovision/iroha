// check-existing-team-context-fortune.js
// 既存のチームコンテキスト運勢レコードを直接確認し、内容を詳細に分析する

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function checkExistingTeamContextFortune() {
  try {
    // MongoDBに接続
    console.log('MongoDBに接続中...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'dailyfortune'
    });
    console.log('MongoDB接続成功');
    
    // TeamContextFortuneコレクションのスキーマ定義
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
    
    // 指定したチームIDの最新レコードを取得
    const teamId = process.argv[2] || '6805e8e7952f7bda054b4477';
    console.log(`チームID ${teamId} のレコードを検索中...`);
    
    const records = await TeamContextFortune.find({ 
      teamId: new mongoose.Types.ObjectId(teamId) 
    })
    .sort({ createdAt: -1 })
    .limit(5);
    
    if (records.length === 0) {
      console.log('指定したチームIDのチームコンテキスト運勢レコードは見つかりませんでした。');
      return;
    }
    
    console.log(`${records.length}件のレコードが見つかりました。`);
    
    // 最新のレコードを詳細に分析
    const record = records[0];
    
    console.log('\n=== 最新のチームコンテキスト運勢レコード ===');
    console.log(`ID: ${record._id}`);
    console.log(`ユーザーID: ${record.userId}`);
    console.log(`チームID: ${record.teamId}`);
    console.log(`日付: ${record.date}`);
    console.log(`スコア: ${record.score}`);
    console.log(`作成日時: ${record.createdAt}`);
    console.log(`更新日時: ${record.updatedAt}`);
    
    // teamContextAdviceフィールドのデータ確認
    console.log('\n=== teamContextAdvice フィールド分析 ===');
    
    if (!record.teamContextAdvice) {
      console.log('❌ 警告: teamContextAdviceフィールドは空または存在しません');
      return;
    }
    
    console.log(`全体の長さ: ${record.teamContextAdvice.length}文字`);
    console.log('先頭部分:');
    console.log(record.teamContextAdvice.substring(0, 300) + '...');
    
    // ファイルに保存（全文を確認するため）
    const filename = `team-context-advice-${record._id}.md`;
    fs.writeFileSync(filename, record.teamContextAdvice);
    console.log(`\n✅ 全文を${filename}に保存しました`);
    
    // Markdownの構造を分析
    console.log('\n=== Markdownの構造分析 ===');
    
    // ヘッダーを検出
    const expectedHeaders = [
      '# 本日のチーム運勢',
      '## チームコンテキストにおける運勢',
      '## チーム目標達成のための具体的アドバイス',
      '## チーム内での役割発揮のポイント'
    ];
    
    console.log('ヘッダー検出:');
    const headersFound = expectedHeaders.map(header => {
      const found = record.teamContextAdvice.includes(header);
      console.log(`  ${header}: ${found ? '✅ 見つかりました' : '❌ 見つかりません'}`);
      return found;
    });
    
    const allHeadersFound = headersFound.every(found => found);
    console.log(`\n全ヘッダー検出状況: ${allHeadersFound ? '✅ 全て存在します' : '❌ 一部または全てが存在しません'}`);
    
    // セクション分割（Markdown処理）
    const sections = record.teamContextAdvice.split(/^## /m);
    
    console.log(`\nセクション分割結果: ${sections.length} セクション`);
    
    if (sections.length > 1) {
      // タイトル部分（最初のセクション）
      const titleSection = sections[0].trim();
      console.log('\nタイトルセクション:');
      console.log(titleSection);
      
      // 残りのセクション
      for (let i = 1; i < sections.length; i++) {
        const sectionLines = sections[i].trim().split('\n');
        const sectionTitle = sectionLines[0].trim();
        const sectionContent = sectionLines.slice(1).join('\n').trim();
        
        console.log(`\n=== セクション ${i}: ${sectionTitle} ===`);
        console.log(`長さ: ${sectionContent.length} 文字`);
        console.log('内容サンプル:');
        console.log(sectionContent.substring(0, 150) + '...');
        
        // セクションの長さを評価
        const expectedMinLength = i === 1 ? 150 : (i === 2 ? 250 : 100);
        if (sectionContent.length < expectedMinLength) {
          console.log(`❌ 警告: このセクションは期待される最小長（${expectedMinLength}文字）より短いです`);
        } else {
          console.log(`✅ セクションの長さは十分です`);
        }
      }
    } else {
      console.log('❌ 警告: Markdownセクションが適切に分割できませんでした');
    }
    
    // collaborationTipsフィールドが存在しないことを確認
    console.log('\n=== collaborationTips フィールドの検証 ===');
    
    if ('collaborationTips' in record) {
      console.log('❌ 警告: collaborationTipsフィールドがまだ存在しています！');
      console.log(`   フィールド値: ${JSON.stringify(record.collaborationTips)}`);
    } else {
      console.log('✅ collaborationTipsフィールドは正常に削除されています');
    }
    
    // データ構造の問題点を分析
    console.log('\n=== データ構造の分析と提案 ===');
    
    // teamContextAdviceにMarkdown形式の全文が含まれているか
    if (allHeadersFound) {
      console.log('✅ teamContextAdviceフィールドには全てのセクションヘッダーが含まれています');
      console.log('   これはリファクタリング後の期待される状態です');
    } else {
      console.log('❌ 問題: teamContextAdviceフィールドに一部または全てのセクションヘッダーが含まれていません');
      console.log('   サーバー側のClaudeレスポンス処理を確認する必要があります');
    }
    
    // 最初と最後のセクションの存在確認
    const hasFirstSection = record.teamContextAdvice.includes('## チームコンテキストにおける運勢');
    const hasLastSection = record.teamContextAdvice.includes('## チーム内での役割発揮のポイント');
    
    if (hasFirstSection && hasLastSection) {
      console.log('✅ 最初のセクションと最後のセクションが両方存在します');
    } else {
      console.log('❌ 問題: 最初のセクションまたは最後のセクションが見つかりません');
      console.log('   Claude APIのレスポンス形式が期待と異なる可能性があります');
    }
    
    // 提案
    console.log('\n=== 提案 ===');
    console.log('1. teamContextAdviceフィールドに適切に全文が保存されていることを確認してください');
    console.log('2. クライアント側の表示ロジックで、Markdown形式のテキストを適切に解析・表示するよう修正してください');
    console.log('3. collaborationTipsフィールドは非推奨とし、使用を中止することを検討してください');
    
    // 同じチームの他のレコードの簡易チェック
    if (records.length > 1) {
      console.log('\n=== 同じチームの他のレコード（概要） ===');
      for (let i = 1; i < records.length; i++) {
        const r = records[i];
        console.log(`\nレコード ${i+1}:`);
        console.log(`ID: ${r._id}`);
        console.log(`作成日時: ${r.createdAt}`);
        console.log(`teamContextAdvice長さ: ${r.teamContextAdvice?.length || 0} 文字`);
        console.log(`collaborationTips数: ${r.collaborationTips?.length || 0}`);
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

// 実行
checkExistingTeamContextFortune();