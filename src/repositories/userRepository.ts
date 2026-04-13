import User from '../models/User';
import { IUser } from '../types/user';

export class UserRepository {
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    return await User.create(userData);
  }

  async findByPhone(phone: string): Promise<IUser | null> {
    return await User.findOne({ phone });
  }

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async updateById(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updateData, { new: true });
  }

  async getAllUsers(): Promise<IUser[]> {
    return await User.find();
  }
}

export default new UserRepository();
