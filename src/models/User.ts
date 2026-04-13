import mongoose, { Schema } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { IUser } from '../types/user';

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Optional email
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    isActive: { type: Boolean, default: true },
    membershipStatus: {
      type: String,
      enum: ['active', 'expired', 'inactive'],
      default: 'inactive',
    },
    address: { type: String },
    profileImage: { type: String },
    metadata: {
      weight: Number,
      height: Number,
      bmi: Number,
    },
    isTestUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Password hashing middleware
UserSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, (this as any).password);
};

export default mongoose.model<IUser>('User', UserSchema);
