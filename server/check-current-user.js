const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('dailyfortune');
    
    // 対象ユーザーとログ行に表示されているユーザーを両方確認
    const shiraishiUser = await db.collection('users').findOne(
      { email: 'shiraishi.tatsuya@mikoto.co.jp' },
      { projection: { _id: 1, email: 1, displayName: 1, careerAptitude: 1 } }
    );
    
    const userWithObjId = await db.collection('users').findOne(
      { _id: { $eq: '67f87e86a7d83fb995de0ee6' } },
      { projection: { _id: 1, email: 1, displayName: 1, careerAptitude: 1 } }
    );
    
    console.log('Shiraishi User:', {
      _id: shiraishiUser._id.toString(),
      email: shiraishiUser.email,
      displayName: shiraishiUser.displayName,
      careerAptitude: shiraishiUser.careerAptitude.substring(0, 50) + '...' // 短く表示
    });
    
    if (userWithObjId) {
      console.log('User with ID 67f87e86a7d83fb995de0ee6:', {
        _id: userWithObjId._id,
        email: userWithObjId.email,
        displayName: userWithObjId.displayName,
        careerAptitude: userWithObjId.careerAptitude ? userWithObjId.careerAptitude.substring(0, 50) + '...' : 'なし'
      });
    } else {
      console.log('User with ID 67f87e86a7d83fb995de0ee6 not found');
    }
    
    // 全ユーザーのリストを取得（サンプル5件）
    console.log('\nSample Users:');
    const users = await db.collection('users')
      .find({})
      .project({ _id: 1, email: 1, displayName: 1 })
      .limit(5)
      .toArray();
    
    users.forEach(user => {
      console.log(`- ${user._id}: ${user.email} (${user.displayName})`);
    });
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);