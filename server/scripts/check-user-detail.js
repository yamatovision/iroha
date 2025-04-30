const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkUserDetail() {
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
    
    // Define schemas
    const UserSchema = new mongoose.Schema({}, { strict: false });
    
    // Define models
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    // ユーザー詳細データの取得
    const userEmail = "shiraishi.tatsuya@mikoto.co.jp";
    console.log(`\nFetching detailed user info for: ${userEmail}`);
    const user = await User.findOne({ email: userEmail }).lean();
    
    if (user) {
      console.log('User found:');
      console.log(JSON.stringify(user, null, 2));

      // ユーザー構造の情報を表示
      console.log('\nUser Document Structure:');
      console.log('--------------------------------------------------');
      Object.keys(user).forEach(key => {
        const value = user[key];
        if (value === null) {
          console.log(`${key}: null`);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          console.log(`${key}: Object with keys: [${Object.keys(value).join(', ')}]`);
        } else if (Array.isArray(value)) {
          console.log(`${key}: Array with ${value.length} items`);
        } else {
          console.log(`${key}: ${typeof value} = ${value}`);
        }
      });
      console.log('--------------------------------------------------');
    } else {
      console.log(`No user found with email: ${userEmail}`);
    }
    
    // Disconnect
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserDetail();