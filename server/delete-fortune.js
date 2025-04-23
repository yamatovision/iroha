const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in environment');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // 直接指定されたIDで削除する
    const fortuneId = '680826f699ae9940d6b9ea3f';
    const userId = '67f87e86a7d83fb995de0ee6';
    
    console.log(`Trying to delete fortune with ID: ${fortuneId} for user: ${userId}`);
    
    // 指定されたIDの運勢データを検索
    const dailyFortunes = await db.collection('dailyfortunes').find({ 
      _id: new ObjectId(fortuneId),
      userId: new ObjectId(userId)
    }).toArray();
    
    console.log('Found fortunes:', dailyFortunes.length);
    
    if (dailyFortunes.length > 0) {
      // 運勢データを削除
      const result = await db.collection('dailyfortunes').deleteOne({ 
        _id: new ObjectId(fortuneId),
        userId: new ObjectId(userId)
      });
      console.log('Deleted', result.deletedCount, 'fortune records');
    } else {
      console.log('No fortune data found for today');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

main();
