require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkDailyFortunes() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/dailyfortune';
    console.log('Using MongoDB URI:', uri);
    console.log('Connecting to MongoDB...');
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB successfully');
        
        const db = client.db('dailyfortune');
        const dailyFortunes = await db.collection('dailyfortunes').find({}).toArray();
        
        console.log('\nAll Daily Fortunes:');
        dailyFortunes.forEach((fortune, index) => {
            console.log(`${index + 1}. User ID: ${fortune.userId}`);
            console.log(`   Date: ${new Date(fortune.date).toISOString()}`);
            console.log(`   Score: ${fortune.fortuneScore}`);
            console.log(`   Day Pillar ID: ${fortune.dayPillarId}`);
            if (fortune.fortuneDescription) {
                console.log(`   Description: ${fortune.fortuneDescription.substring(0, 50)}...`);
            }
            console.log('---');
        });
        
        console.log('\nTotal Daily Fortunes:', dailyFortunes.length);

        // チームメンバーカードを確認
        const teamMemberCards = await db.collection('teammembercards').find({}).toArray();
        console.log('\nAll Team Member Cards:');
        teamMemberCards.forEach((card, index) => {
            console.log(`${index + 1}. User ID: ${card.userId}`);
            console.log(`   Team ID: ${card.teamId}`);
            console.log(`   Display Name: ${card.displayName}`);
            console.log('---');
        });
        
        console.log('\nTotal Team Member Cards:', teamMemberCards.length);
        
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

checkDailyFortunes();