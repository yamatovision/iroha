const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('dailyfortune');
    
    // ユーザーデータ取得
    const user = await db.collection('users').findOne(
      { email: 'shiraishi.tatsuya@mikoto.co.jp' },
      { projection: { careerAptitude: 1 } }
    );
    
    console.log('Found careerAptitude:', user.careerAptitude);
    
    // JSON解析テスト
    try {
      const parsed = JSON.parse(user.careerAptitude);
      console.log('\nJSON解析成功!');
      console.log('type:', parsed.type);
      console.log('version:', parsed.version);
      console.log('content:', parsed.content ? parsed.content.substring(0, 100) + '...' : 'なし');
      
      // JSON.stringify()でエスケープ状態を確認
      console.log('\nJSON.stringify()でのエスケープ状態:');
      const reStringified = JSON.stringify(parsed);
      console.log(reStringified.substring(0, 200) + '...');
      
    } catch (error) {
      console.error('\nJSON解析エラー:', error.message);
    }
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);