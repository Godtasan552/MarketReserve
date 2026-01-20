import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Zone from '../src/models/Zone';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;

async function checkZones() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const zones = await Zone.find({});
    console.log(`\nFound ${zones.length} zones in database:`);
    zones.forEach(zone => {
      console.log(`- ${zone.name} (ID: ${zone._id}, Active: ${zone.isActive})`);
    });

    if (zones.length === 0) {
      console.log('\n⚠️  No zones found! Please run: npm run seed');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkZones();
