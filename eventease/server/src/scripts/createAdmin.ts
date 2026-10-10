import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { config } from '../config/env';

const createAdmin = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('[Setup] Connected to database to check administrator account.');

    const adminEmail = config.ADMIN_EMAIL.toLowerCase();
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`[Setup] Admin account already exists for ${adminEmail}. Role: ${existingAdmin.role}.`);
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`[Setup] Updated ${adminEmail} role to 'admin'.`);
      }
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(config.ADMIN_PASSWORD, salt);

    const newAdmin = await User.create({
      name: config.ADMIN_NAME,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      status: 'active',
      department: 'Central Administration',
      studentIdNumber: 'ADM-001',
    });

    console.log(`=========================================`);
    console.log(`✅ Initial Admin Account Created Successfully:`);
    console.log(`   Name:  ${newAdmin.name}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Role:  ${newAdmin.role}`);
    console.log(`=========================================`);
    process.exit(0);
  } catch (error) {
    console.error('[Setup] Error creating administrator:', error);
    process.exit(1);
  }
};

createAdmin();
