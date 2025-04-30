// test-team-context-fortune.js
// チームコンテキスト運勢のテスト - リファクタリング後の検証

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// APIリクエスト用ユーティリティ関数
async function getAuthToken(email, password) {
  try {
    console.log(`ログイン試行: ${email}`);
    const response = await axios.post('http://localhost:8080/api/v1/jwt-auth/login', {
      email,
      password
    });
    console.log('ログインレスポンス:', response.data);
    return response.data.tokens.accessToken;
  } catch (error) {
    console.error('認証エラー:', error.response?.data || error.message);
    return null;
  }
}

async function getTeamContextFortune(token, teamId) {
  try {
    const response = await axios.get(`http://localhost:8080/api/v1/fortune/team/${teamId}/context`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('チームコンテキスト運勢取得エラー:', error.response?.data || error.message);
    return null;
  }
}

async function generateTeamContextFortune(token, teamId) {
  try {
    const response = await axios.post(`http://localhost:8080/api/v1/fortune/team/${teamId}/context/generate`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('チームコンテキスト運勢生成エラー:', error.response?.data || error.message);
    return null;
  }
}

// データベース直接検査用ユーティリティ関数
async function checkDatabaseRecord(teamContextFortuneId) {
  try {
    // MongoDBに接続
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
      collaborationTips: [String],
      createdAt: Date,
      updatedAt: Date
    });
    
    const TeamContextFortune = mongoose.model('TeamContextFortune', teamContextFortuneSchema);
    
    // IDによるレコード取得
    const record = await TeamContextFortune.findById(teamContextFortuneId);
    
    console.log('\n--- データベースレコードの検証 ---');
    console.log(`ID: ${record._id}`);
    console.log(`ユーザーID: ${record.userId}`);
    console.log(`チームID: ${record.teamId}`);
    console.log(`日付: ${record.date}`);
    console.log(`スコア: ${record.score}`);
    
    // teamContextAdviceフィールドのデータ確認
    console.log('\n--- teamContextAdvice フィールド ---');
    console.log(`全体の長さ: ${record.teamContextAdvice.length}文字`);
    console.log('先頭部分:');
    console.log(record.teamContextAdvice.substring(0, 300) + '...');
    
    // 段落に分割して内容確認
    const paragraphs = record.teamContextAdvice.split('\n\n').filter(p => p.trim());
    console.log(`\n段落数: ${paragraphs.length}`);
    
    // 各段落の先頭部分を確認
    paragraphs.forEach((p, i) => {
      console.log(`\n段落 ${i+1} (先頭50文字):`)
      console.log(p.substring(0, 50) + (p.length > 50 ? '...' : ''));
    });
    
    // collaborationTipsフィールドのデータ確認
    console.log('\n--- collaborationTips フィールド ---');
    console.log(`要素数: ${record.collaborationTips.length}`);
    if (record.collaborationTips.length > 0) {
      record.collaborationTips.forEach((tip, i) => {
        console.log(`\nヒント ${i+1}:`);
        console.log(tip.substring(0, 100) + (tip.length > 100 ? '...' : ''));
      });
    } else {
      console.log('collaborationTips配列は空です（リファクタリング後の期待値）');
    }
    
    return record;
  } catch (error) {
    console.error('データベース検証エラー:', error);
    return null;
  } finally {
    // MongoDB接続を閉じる
    await mongoose.connection.close();
    console.log('MongoDB接続終了');
  }
}

// テスト実行
async function runTest() {
  // テストパラメータ
  const testUser = {
    email: 'shiraishi.tatsuya@mikoto.co.jp', // 管理者ユーザー
    password: 'aikakumei'                    // 確認済みのパスワード
  };
  const teamId = '6805e8e7952f7bda054b4477'; // 既存のチームID
  
  console.log('=== チームコンテキスト運勢 テスト開始 ===');
  
  try {
    // 1. 認証トークンの取得
    console.log('\n1. 認証トークンの取得中...');
    const token = await getAuthToken(testUser.email, testUser.password);
    if (!token) {
      throw new Error('認証に失敗しました。ユーザー名とパスワードを確認してください。');
    }
    console.log('認証成功: トークン取得完了');
    
    // 2. 新しいチームコンテキスト運勢の生成
    console.log('\n2. チームコンテキスト運勢の生成中...');
    const generateResult = await generateTeamContextFortune(token, teamId);
    if (!generateResult || !generateResult.teamContextFortune) {
      throw new Error('チームコンテキスト運勢の生成に失敗しました。');
    }
    console.log('生成成功: 新しいチームコンテキスト運勢が生成されました');
    
    const fortuneId = generateResult.teamContextFortune.id;
    console.log(`運勢ID: ${fortuneId}`);
    
    // 3. 生成されたチームコンテキスト運勢の取得
    console.log('\n3. 生成されたチームコンテキスト運勢の取得中...');
    const getResult = await getTeamContextFortune(token, teamId);
    if (!getResult || !getResult.teamContextFortune) {
      throw new Error('チームコンテキスト運勢の取得に失敗しました。');
    }
    
    const fortune = getResult.teamContextFortune;
    console.log('取得成功: チームコンテキスト運勢の詳細:');
    console.log(`ID: ${fortune.id}`);
    console.log(`ユーザーID: ${fortune.userId}`);
    console.log(`チームID: ${fortune.teamId}`);
    console.log(`スコア: ${fortune.score}`);
    
    console.log('\nteamContextAdvice (一部):');
    console.log(fortune.teamContextAdvice.substring(0, 200) + '...');
    
    console.log('\ncollaborationTips:');
    if (fortune.collaborationTips && fortune.collaborationTips.length > 0) {
      console.log(`${fortune.collaborationTips.length}件のヒントがあります`);
    } else {
      console.log('collaborationTipsはありません（リファクタリング後の期待値）');
    }
    
    // 4. データベースに直接アクセスして検証
    console.log('\n4. データベースのレコードを直接検証...');
    await checkDatabaseRecord(fortuneId);
    
    console.log('\n=== テスト完了: 成功 ===');
  } catch (error) {
    console.error('\n=== テスト失敗 ===');
    console.error('エラー:', error.message);
  }
}

// テスト実行
runTest();