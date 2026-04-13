import cron from 'node-cron';
import User from '../models/User';
import Subscription from '../models/Subscription';
import logger from '../utils/logger';

class CronService {
  private isExpiryJobRunning = false;

  init() {
    // Run Daily Expiry Check at 00:01 AM
    // Seconds Minutes Hours DayOfMonth Month DayOfWeek
    cron.schedule('1 0 * * *', () => {
      this.checkMembershipExpiry();
    });

    logger.info('Cron Jobs initialized successfully');
  }

  async checkMembershipExpiry() {
    if (this.isExpiryJobRunning) return;
    this.isExpiryJobRunning = true;

    try {
      logger.info('Starting daily membership expiry check...');
      
      const now = new Date();
      
      // 1. Find active users whose membership has passed its end date
      const expiredCount = await User.updateMany(
        {
          membershipStatus: 'active',
          // We assume the actual expiry logic might need more nuance, 
          // but for phase 1 we'll look at the user directly if we had an endDate there.
          // Since we currently have endDate in Subscriptions, let's correlate.
        },
        [
          // Conditional update based on their latest active subscription
          // For simplicity in Phase 2, we will look for users who have NO active subscriptions with endDate > now
        ]
      );

      // Revised logic: Find all active users, check their latest subscription
      const activeUsers = await User.find({ membershipStatus: 'active' });
      let deactivated = 0;

      for (const user of activeUsers) {
        const latestSub = await Subscription.findOne({ 
          userId: user._id, 
          status: 'active' 
        }).sort({ endDate: -1 });

        if (!latestSub || latestSub.endDate < now) {
          user.membershipStatus = 'expired';
          await user.save();
          deactivated++;
          logger.info(`Membership expired for user: ${user.phone}`);
        }
      }

      logger.info(`Expiry check completed. ${deactivated} memberships marked as expired.`);
    } catch (error: any) {
      logger.error(`Cron Expiry Job Error: ${error.message}`);
    } finally {
      this.isExpiryJobRunning = false;
    }
  }

  // Manual trigger for testing
  async triggerManualExpiryCheck() {
    return await this.checkMembershipExpiry();
  }
}

export default new CronService();
