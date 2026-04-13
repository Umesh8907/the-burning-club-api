import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email?: string;
  phone: string;
  password: string;
  role: 'customer' | 'admin';
  isActive: boolean;
  membershipStatus: 'active' | 'expired' | 'inactive';
  address?: string;
  profileImage?: string;
  metadata?: {
    weight?: number;
    height?: number;
    bmi?: number;
  };
  isTestUser: boolean;
  comparePassword(enteredPassword: string): Promise<boolean>;
}
