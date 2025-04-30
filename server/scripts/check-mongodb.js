const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkMongoDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
  const DB_NAME = process.env.DB_NAME || 'dailyfortune';
  
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    return;
  }
  
  console.log('Using MongoDB URI:', MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });
    console.log('Connected to MongoDB successfully');
    
    // Check User collection
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    const count = await User.countDocuments();
    console.log(`Total users in database: ${count}`);
    
    // DayPillarコレクションを確認
    const DayPillarSchema = new mongoose.Schema({}, { strict: false });
    const DayPillar = mongoose.models.DayPillar || mongoose.model('DayPillar', DayPillarSchema);
    
    const dayPillarCount = await DayPillar.countDocuments();
    console.log(`\nTotal day pillars in database: ${dayPillarCount}`);
    
    // 最近の日柱データを表示
    const recentDayPillars = await DayPillar.find().sort({ date: -1 }).limit(5).lean();
    if (recentDayPillars.length > 0) {
      console.log('\nRecent day pillars:');
      recentDayPillars.forEach((dp, index) => {
        console.log(`  ${index + 1}. Date: ${dp.date}, Stem: ${dp.heavenlyStem}, Branch: ${dp.earthlyBranch}`);
      });
    } else {
      console.log('\nNo day pillar data found');
    }
    
    // サーバー起動で使うテスト用ユーザーを検索
    const email = "shiraishi.tatsuya@mikoto.co.jp";
    const firebaseUid = "Bs2MacLtK1Z1fVnau2dYPpsWRpa2";
    
    console.log('\nSearching for user with email:', email);
    let user = await User.findOne({ email }).lean();
    
    if (!user) {
      console.log('メールアドレスでユーザーが見つかりませんでした。UIDで検索します。');
      // UIDでも検索
      user = await User.findOne({ uid: firebaseUid }).lean();
      if (!user) {
        console.log('UIDでもユーザーが見つかりませんでした。');
      }
    }
    
    // Firebaseの認証情報で登録されているすべてのユーザーを確認
    const firebaseUsers = await User.find().lean();
    console.log(`\nChecking all ${firebaseUsers.length} users for Firebase auth data:`);
    firebaseUsers.forEach((u, i) => {
      console.log(`User ${i+1}: Email=${u.email}, UID=${u.uid || 'N/A'}, _id=${u._id}`);
    });
    
    if (user) {
      console.log('\nFound user with email:', email);
      console.log('  ID:', user._id);
      console.log('  UID:', user.uid);
      console.log('  Email:', user.email);
      console.log('  Display Name:', user.displayName);
      console.log('  Role:', user.role);
      console.log('  Plan:', user.plan);
      console.log('  Goal:', user.goal);
      console.log('  Birth Date:', user.birthDate);
      console.log('  Birth Time:', user.birthTime);
      console.log('  Birth Place:', user.birthPlace);
      console.log('  Gender:', user.gender);
      if (user.birthplaceCoordinates) {
        console.log('  Coordinates:', 
          user.birthplaceCoordinates.longitude,
          user.birthplaceCoordinates.latitude);
      }
      console.log('  Local Time Offset:', user.localTimeOffset);
      console.log('  Element Attribute:', user.elementAttribute);
      console.log('  Has fourPillars:', !!user.fourPillars);
      console.log('  Saju Profile ID:', user.sajuProfileId);
      
      // チェック: 今日の運勢データがあるか
      const FortuneSchema = new mongoose.Schema({}, { strict: false });
      const Fortune = mongoose.models.DailyFortune || mongoose.model('DailyFortune', FortuneSchema);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // ユーザーIDまたはUIDで検索
      const fortune = await Fortune.findOne({
        $or: [
          { userId: user._id },
          { userId: user.uid }
        ],
        date: {
          $gte: today,
          $lt: tomorrow
        }
      }).lean();
      
      if (fortune) {
        console.log('\nFound fortune data for today:');
        console.log('  ID:', fortune._id);
        console.log('  User ID:', fortune.userId);
        console.log('  Date:', fortune.date);
        console.log('  Day Pillar ID:', fortune.dayPillarId);
        console.log('  Fortune Score:', fortune.fortuneScore);
        console.log('  Lucky Items:', JSON.stringify(fortune.luckyItems, null, 2));
      } else {
        console.log('\nNo fortune data found for today');
      }
    } else {
      console.log('No user found with email:', email);
    }
    
    // すべてのユーザーの数を表示
    const allUsers = await User.find().lean();
    console.log(`\nTotal users: ${allUsers.length}`);
    
    // 最近作成された5人のユーザーを表示
    console.log('\nRecent users:');
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).lean();
    recentUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.displayName}) - Role: ${user.role}`);
    });
    
    // Disconnect
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMongoDB();