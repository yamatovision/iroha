const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkJwtStatus() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
  const DB_NAME = process.env.DB_NAME || 'dailyfortune';
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });
    console.log('Connected to MongoDB successfully');
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    const users = await User.find().lean();
    
    console.log(`\nJWT Migration Status for ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}: ${user.email}`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Firebase UID: ${user.firebaseUid || user.uid || 'N/A'}`);
      console.log(`  JWT Password Set: ${Boolean(user.password)}`);
      console.log(`  JWT Ready: ${Boolean(user.refreshToken)}`);
      console.log(`  Token Version: ${user.tokenVersion || 0}`);
      console.log(`  Last Login: ${user.lastLogin || 'N/A'}`);
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkJwtStatus();