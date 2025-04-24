// A simple script to check a user's information for debugging
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Import models
const User = require('./dist/models/User').User;
const Compatibility = require('./dist/models/Compatibility').Compatibility;

// Function to lookup a user
async function lookupUser(userId) {
  try {
    // Find user by ID or email
    let user;
    if (userId.includes('@')) {
      user = await User.findOne({ email: userId });
    } else {
      user = await User.findById(userId);
    }
    
    if (!user) {
      console.log(`User not found with ID/email: ${userId}`);
      return;
    }
    
    console.log('User Information:');
    console.log('------------------');
    console.log(`ID: ${user._id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Display Name: ${user.displayName}`);
    console.log(`Element Attribute: ${user.elementAttribute}`);
    console.log(`Team ID: ${user.teamId || 'No team'}`);
    
    // Check four pillars
    if (user.fourPillars) {
      console.log('\nFour Pillars:');
      console.log(JSON.stringify(user.fourPillars, null, 2));
    } else {
      console.log('\nFour Pillars: Not set');
    }
    
    // Check kakukyoku
    if (user.kakukyoku) {
      console.log('\nKakukyoku:');
      console.log(JSON.stringify(user.kakukyoku, null, 2));
    } else {
      console.log('\nKakukyoku: Not set');
    }
    
    // Check yojin
    if (user.yojin) {
      console.log('\nYojin:');
      console.log(JSON.stringify(user.yojin, null, 2));
    } else {
      console.log('\nYojin: Not set');
    }
    
    // Check compatibility records
    const compatibilityRecords = await Compatibility.find({
      $or: [
        { user1Id: user._id.toString() },
        { user2Id: user._id.toString() }
      ]
    });
    
    if (compatibilityRecords.length > 0) {
      console.log('\nCompatibility Records:');
      console.log(`Total Records: ${compatibilityRecords.length}`);
      
      // Count records with enhancedDetails
      const enhancedRecords = compatibilityRecords.filter(r => r.enhancedDetails);
      console.log(`Records with enhancedDetails: ${enhancedRecords.length}`);
      
      if (enhancedRecords.length > 0) {
        console.log('\nSample Enhanced Details:');
        console.log(JSON.stringify(enhancedRecords[0].enhancedDetails, null, 2));
      }
    } else {
      console.log('\nNo compatibility records found.');
    }
  } catch (error) {
    console.error('Error looking up user:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Check command line arguments
if (process.argv.length < 3) {
  console.log('Usage: node lookup-user.js <userId-or-email>');
  process.exit(1);
}

// Get user ID from command line
const userId = process.argv[2];
lookupUser(userId);
