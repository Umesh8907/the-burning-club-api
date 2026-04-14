import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/the-burning-club';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Seeding...');

    const adminData = {
      name: 'Admin',
      phone: '1234567890',
      password: 'Admin@gym',
      role: 'admin',
      membershipStatus: 'active'
    };

    const existingAdmin = await User.findOne({ phone: adminData.phone });

    if (existingAdmin) {
      existingAdmin.role = 'admin';
      existingAdmin.password = adminData.password; // Model pre-save will hash this
      await existingAdmin.save();
      console.log('Admin user updated successfully');
    } else {
      await User.create(adminData);
      console.log('Admin user created successfully');
    }

    console.log('Seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedAdmin();
