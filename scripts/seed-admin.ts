import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import User from '../src/models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI or MONGO_URL environment variable inside .env');
  process.exit(1);
}

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const adminName = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Error: ADMIN_USERNAME or ADMIN_PASSWORD not found in .env');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log(`Admin with email ${adminEmail} already exists. Updating details from .env...`);
      existingAdmin.name = adminName || existingAdmin.name;
      existingAdmin.password = adminPassword; // Pre-save hook will re-hash
      await existingAdmin.save();
      console.log('Admin details updated successfully!');
    } else {
      const adminUser = new User({
        email: adminEmail,
        password: adminPassword,
        name: adminName || 'System Admin',
        role: 'superadmin',
        isActive: true,
        emailVerified: true,
      });

      await adminUser.save();
      console.log('SuperAdmin created successfully!');
    }
    
    console.log('--- Current Admin Config ---');
    console.log('Name:', adminName || 'System Admin');
    console.log('Email:', adminEmail);
    console.log('Password synced with .env');
    console.log('---------------------------');
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seedAdmin();
