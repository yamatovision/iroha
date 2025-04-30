// Test script for enhanced compatibility service
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

async function testEnhancedCompatibility(user1Id, user2Id) {
  try {
    // Import the enhanced compatibility service
    const { enhancedCompatibilityService } = require('./dist/services/team/enhanced-compatibility.service');
    
    console.log(`Testing enhanced compatibility between users ${user1Id} and ${user2Id}`);
    
    // Call the service method directly
    const result = await enhancedCompatibilityService.getOrCreateEnhancedCompatibility(user1Id, user2Id);
    
    console.log('\nEnhanced Compatibility Result:');
    console.log('------------------------------');
    console.log(`Compatibility ID: ${result._id}`);
    console.log(`Score: ${result.compatibilityScore}`);
    console.log(`Relationship Type: ${result.relationshipType}`);
    
    if (result.enhancedDetails) {
      console.log('\nEnhanced Details:');
      console.log(JSON.stringify(result.enhancedDetails, null, 2));
    } else {
      console.log('\nWARNING: enhancedDetails is not present in the result!');
      console.log('This indicates a potential issue in the service implementation.');
    }
    
    // Print detail description (truncated)
    if (result.detailDescription) {
      console.log('\nDetail Description (first 200 chars):');
      console.log(result.detailDescription.substring(0, 200) + '...');
    }
  } catch (error) {
    console.error('Error testing enhanced compatibility:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Check command line arguments
if (process.argv.length < 4) {
  console.log('Usage: node test-enhanced-compatibility.js <user1Id> <user2Id>');
  process.exit(1);
}

// Get user IDs from command line
const user1Id = process.argv[2];
const user2Id = process.argv[3];
testEnhancedCompatibility(user1Id, user2Id);