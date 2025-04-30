/**
 * MongoDBのコレクション一覧を表示する簡易スクリプト
 * SajuProfileコレクションの存在確認用
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

async function checkCollections() {
  console.log('Connecting to MongoDB...');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db();
    console.log(`Using database: ${db.databaseName}`);
    
    // コレクション一覧を取得
    const collections = await db.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections:`);
    
    // コレクション名でソート
    collections.sort((a, b) => a.name.localeCompare(b.name));
    
    // 各コレクションの情報を表示
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
      
      // SajuProfileコレクションが存在する場合は詳細情報を表示
      if (collection.name === 'sajuprofiles') {
        console.log(`\n⚠️ SajuProfile collection found! Details:`);
        const profiles = await db.collection('sajuprofiles').find({}).limit(5).toArray();
        console.log(`Sample data (up to 5 documents):`);
        
        if (profiles.length === 0) {
          console.log('No documents in SajuProfile collection');
        } else {
          profiles.forEach((profile, index) => {
            console.log(`\nProfile ${index + 1}:`);
            console.log(`- _id: ${profile._id}`);
            console.log(`- userId: ${profile.userId}`);
            console.log(`- createdAt: ${profile.createdAt}`);
          });
        }
      }
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// スクリプト実行
checkCollections().catch(console.error);