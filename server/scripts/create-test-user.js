const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const uri = 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

async function createTestUser() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('MongoDBに接続しました');
    
    const db = client.db('dailyfortune');
    
    // パスワードハッシュ化
    const password = 'testpassword123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('パスワードハッシュ化結果:');
    console.log('- 元のパスワード:', password);
    console.log('- ハッシュ化パスワード:', hashedPassword);
    console.log('- ハッシュ長:', hashedPassword.length);
    
    // 新規テストユーザー作成
    const testUser = {
      _id: new ObjectId(),
      email: 'test@example.com',
      password: hashedPassword,
      displayName: 'Test User',
      role: 'User',
      plan: 'lite',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // ユーザーを保存
    const result = await db.collection('users').insertOne(testUser);
    console.log(`テストユーザー作成完了: ${result.insertedId}`);
    
    // ハッシュ検証テスト
    console.log('\nパスワード検証テスト:');
    const correctTest = await bcrypt.compare(password, hashedPassword);
    console.log('- 正しいパスワード:', correctTest);
    
    const wrongTest = await bcrypt.compare('wrongpassword', hashedPassword);
    console.log('- 間違ったパスワード:', wrongTest);
    
    // 既存のユーザーのパスワードを更新
    console.log('\n既存ユーザーのパスワード更新:');
    const existingUsers = await db.collection('users').find({
      email: { $in: ['shiraishi.tatsuya@mikoto.co.jp', 'shiraishi.ami@mikoto.co.jp'] }
    }).toArray();
    
    for (const user of existingUsers) {
      const newPassword = 'aikakumei';
      const newSalt = await bcrypt.genSalt(10);
      const newHashedPassword = await bcrypt.hash(newPassword, newSalt);
      
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { password: newHashedPassword } }
      );
      
      console.log(`${user.email} のパスワードを更新しました`);
      console.log('- 新しいハッシュ:', newHashedPassword);
      console.log('- 検証テスト:', await bcrypt.compare(newPassword, newHashedPassword));
    }
    
  } catch (err) {
    console.error('エラー:', err);
  } finally {
    await client.close();
    console.log('\nMongoDBの接続を閉じました');
  }
}

createTestUser();