const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';

async function createSampleData() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('dailyfortune');
    
    // 既存のユーザーを取得
    const users = await db.collection('users').find({}).toArray();
    if (users.length < 2) {
      console.error('ユーザーが見つかりません。先にユーザーを作成してください。');
      return;
    }
    
    // ユーザーIDを取得
    const tatstuyaUserId = users.find(u => u.email === 'shiraishi.tatsuya@mikoto.co.jp')._id;
    const amiUserId = users.find(u => u.email === 'shiraishi.ami@mikoto.co.jp')._id;
    
    console.log(`Tatsuya UserID: ${tatstuyaUserId}`);
    console.log(`Ami UserID: ${amiUserId}`);
    
    // チームを作成
    const teamResult = await db.collection('teams').insertOne({
      _id: new ObjectId(),
      name: 'テストチーム',
      description: 'テスト用のチーム',
      teamGoal: 'チームの目標を達成する',
      organizationId: new ObjectId(), // 仮のOrganizationID
      createdBy: tatstuyaUserId,
      members: [tatstuyaUserId, amiUserId],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const teamId = teamResult.insertedId;
    console.log(`チーム作成: ${teamId}`);
    
    // ユーザーにチームIDを紐付け
    await db.collection('users').updateMany(
      { _id: { $in: [tatstuyaUserId, amiUserId] } },
      { $set: { teamId: teamId } }
    );
    
    // TeamMemberCardを作成
    const teamMemberCardResults = await db.collection('teammembercards').insertMany([
      {
        teamId: teamId,
        userId: tatstuyaUserId,
        cardContent: 'たつやのチームメンバーカルテ内容',
        version: 1,
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        teamId: teamId,
        userId: amiUserId,
        cardContent: 'あみのチームメンバーカルテ内容',
        version: 1,
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    console.log(`TeamMemberCard作成: ${teamMemberCardResults.insertedCount}件`);
    
    // チャット履歴を作成
    const chatHistoryResults = await db.collection('chathistories').insertMany([
      {
        userId: tatstuyaUserId,
        chatType: 'personal',
        messages: [
          {
            sender: 'user',
            content: 'こんにちは、AIさん',
            timestamp: new Date()
          },
          {
            sender: 'ai',
            content: 'こんにちは、たつやさん。どのようにお手伝いできますか？',
            timestamp: new Date()
          }
        ],
        tokenCount: 100,
        contextData: {},
        aiModel: 'sonnet',
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: amiUserId,
        chatType: 'personal',
        messages: [
          {
            sender: 'user',
            content: 'こんにちは、AIさん',
            timestamp: new Date()
          },
          {
            sender: 'ai',
            content: 'こんにちは、あみさん。どのようにお手伝いできますか？',
            timestamp: new Date()
          }
        ],
        tokenCount: 100,
        contextData: {},
        aiModel: 'sonnet',
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    console.log(`ChatHistory作成: ${chatHistoryResults.insertedCount}件`);
    
    console.log('サンプルデータの作成完了');
    
  } catch (err) {
    console.error('エラー:', err);
  } finally {
    await client.close();
    console.log('データベース接続閉じました');
  }
}

createSampleData();