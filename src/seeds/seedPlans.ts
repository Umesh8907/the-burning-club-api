import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Plan from '../models/Plan';

dotenv.config();

const plans = [
  {
    name: 'MONTHLY BURN',
    description: 'Perfect for consistent transformation. Includes: Unlimited gym access, Nutrition Command basics, and progress tracking.',
    price: 1000,
    durationInMonths: 1,
    isActive: true
  },
  {
    name: 'ELITE IGNITION',
    description: 'The tactical choice for long-term results. Includes: All Monthly features + Advanced Tactical Training, Steam & Sauna access, and personal locker.',
    price: 5499,
    durationInMonths: 6,
    isActive: true
  }
];

const seedPlans = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/the-burning-club';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Delete existing plans to avoid duplicates in dev
    await Plan.deleteMany({});
    console.log('Cleared existing plans.');

    await Plan.insertMany(plans);
    console.log('PLANS SEEDED SUCCESSFULLY!');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedPlans();
