const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('dailyfortune');
    
    // 新しい調和のコンパスデータ（JSON形式）
    const newCareerAptitude = JSON.stringify({
      version: '1.0',
      type: 'harmony_compass',
      content: '# 調和のコンパス\n\n## 格局に基づく性格特性\n従旺格の持ち主であるあなたは、自己表現力が強く、リーダーシップの素質を備えています。甲木の日主が強い状態にあるため、決断力があり、自分の意見をはっきりと表明する傾向があります。\n\n## 強化すべき方向性\n用神である水（正官）を強化することで、あなたの強い木の性質に規律と方向性を与えることができます。\n\n## 注意すべきバランス\n命式に水の要素が不足しているため、感情の起伏が激しくなったり、自制心が低下したりする可能性があります。\n\n## 人間関係の智慧\nあなたは水の性質を持つ人（思慮深く、冷静な判断ができる人）との関係が調和的です。\n\n## 成長のための課題\nあなたの主な課題は、強すぎる自己表現を適切にコントロールし、柔軟性と適応力を高めることです。'
    });
    
    console.log('Updating user with new careerAptitude...');
    
    // ユーザーを更新
    const result = await db.collection('users').updateOne(
      { email: 'shiraishi.tatsuya@mikoto.co.jp' },
      { $set: { careerAptitude: newCareerAptitude } }
    );
    
    console.log('Update result:', result.modifiedCount);
    
    // 更新後のデータを確認
    const updatedUser = await db.collection('users').findOne(
      { email: 'shiraishi.tatsuya@mikoto.co.jp' },
      { projection: { careerAptitude: 1 } }
    );
    
    console.log('Updated careerAptitude:');
    console.log(updatedUser.careerAptitude);
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);