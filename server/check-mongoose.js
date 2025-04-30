// チームコンテキスト運勢データを調査するためのスクリプト
require('dotenv').config();
const mongoose = require('mongoose');

async function checkMongooseConnection() {
  try {
    console.log('MongoDBに接続中...');
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI}`);
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'dailyfortune'
    });
    console.log('MongoDB接続成功');

    // コレクション一覧を表示
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('コレクション一覧:');
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });

    // TeamContextFortune コレクションのデータを探す
    const teamContextFortuneCollection = collections.find(c => 
      c.name.toLowerCase() === 'teamcontextfortunes' || 
      c.name.toLowerCase() === 'teamcontextfortune'
    );

    if (teamContextFortuneCollection) {
      console.log(`\nTeamContextFortune コレクション名: ${teamContextFortuneCollection.name}`);
      const data = await mongoose.connection.db.collection(teamContextFortuneCollection.name)
        .find({})
        .sort({createdAt: -1})
        .limit(2)
        .toArray();
      
      console.log(`\nデータ件数: ${data.length}`);
      if (data.length > 0) {
        const sample = data[0];
        console.log('\n--- サンプルデータのフィールド ---');
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          if (typeof value === 'string' && value.length > 50) {
            console.log(`${key}: ${value.substring(0, 50)}...（${value.length}文字）`);
          } else {
            console.log(`${key}: ${value}`);
          }
        });

        // teamContextAdvice と collaborationTips の内容を詳細表示
        if (sample.teamContextAdvice) {
          console.log('\n--- teamContextAdvice 内容 ---');
          console.log(sample.teamContextAdvice);

          // 段落分けして表示
          const paragraphs = sample.teamContextAdvice.split('\n\n').filter(p => p.trim());
          console.log(`\n分割された段落数: ${paragraphs.length}`);
          
          if (paragraphs.length >= 3) {
            console.log('\n--- 推定される3つのセクション ---');
            console.log('\nセクション1: チームコンテキストにおける運勢');
            console.log(paragraphs[0]);
            
            console.log('\nセクション2: チーム目標達成のための具体的アドバイス');
            console.log(paragraphs[1]);
            
            console.log('\nセクション3: チーム内での役割発揮のポイント');
            console.log(paragraphs[2]);
          }
        }

        if (sample.collaborationTips && Array.isArray(sample.collaborationTips)) {
          console.log('\n--- collaborationTips 内容 ---');
          sample.collaborationTips.forEach((tip, i) => {
            console.log(`\n協力ヒント ${i+1}:`);
            console.log(tip);
          });
        }
      }
    } else {
      console.log('TeamContextFortune コレクションが見つかりません');
    }
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB接続終了');
  }
}

checkMongooseConnection();
