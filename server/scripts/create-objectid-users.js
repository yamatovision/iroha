const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const uri = 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

async function createNewUsersWithObjectIds() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('dailyfortune');
    
    // パスワードをハッシュ化
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('aikakumei', salt);
    
    // 新しいObjectIDでユーザーを作成
    const newUsers = [
      {
        _id: new ObjectId(),
        email: 'shiraishi.tatsuya@mikoto.co.jp',
        password: hashedPassword,
        displayName: 'Tatsuya',
        role: 'SuperAdmin',
        plan: 'elite',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        email: 'shiraishi.ami@mikoto.co.jp',
        password: hashedPassword,
        displayName: 'あみ',
        role: 'User',
        plan: 'lite',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // ユーザーを保存
    const result = await db.collection('users').insertMany(newUsers);
    console.log(`${result.insertedCount} new users created with ObjectIDs`);
    
    // 作成したユーザーの情報を表示
    const users = await db.collection('users').find({}).toArray();
    console.log('Created users:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}, Email: ${user.email}, Role: ${user.role}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

createNewUsersWithObjectIds();