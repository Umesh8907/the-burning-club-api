import jwt from 'jsonwebtoken';
import { IUser } from '../types/user';
import redis from '../config/redis';

export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'your_secret';
  private readonly jwtExpire = process.env.JWT_EXPIRE || '24h';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET || 'your_refresh_secret';
  private readonly refreshExpire = process.env.JWT_REFRESH_EXPIRE || '7d';

  generateTokens(user: IUser) {
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      this.jwtSecret,
      { expiresIn: this.jwtExpire as any }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      this.refreshSecret,
      { expiresIn: this.refreshExpire as any }
    );

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string) {
    try {
      return jwt.verify(token, this.refreshSecret) as any;
    } catch (error) {
      return null;
    }
  }

  generateAccessToken(userId: string, role: string) {
    return jwt.sign(
      { id: userId, role },
      this.jwtSecret,
      { expiresIn: this.jwtExpire as any }
    );
  }

  verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, this.jwtSecret) as any;
    } catch (error) {
      return null;
    }
  }

  async blacklistToken(token: string, expiresIn: number) {
    if (process.env.CACHE_STORE === 'redis') {
      await redis.set(`blacklist_${token}`, 'true', 'EX', expiresIn);
    }
    // In memory mode, we skip blacklisting or could implement a small local Map
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (process.env.CACHE_STORE === 'redis') {
      const result = await redis.get(`blacklist_${token}`);
      return result === 'true';
    }
    return false; // Always false in memory mode for simplicity in dev
  }
}

export default new AuthService();
