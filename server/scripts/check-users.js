const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkUsers() {
  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || 'dailyfortune';
  
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    return;
  }
  
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
    
    // Get all users
    const users = await User.find().lean();
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log('  ID:', user._id);
        console.log('  email:', user.email);
        console.log('  displayName:', user.displayName);
        console.log('  role:', user.role);
        console.log('  Fields:', Object.keys(user).join(', '));
      });
    } else {
      console.log('No users found');
    }
    
    // Disconnect
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();