import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

class NotificationService {
  private logPath: string;

  constructor() {
    this.logPath = path.join(__dirname, '../../logs/notifications.log');
    // Ensure logs directory exists
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async sendSMS(phone: string, message: string) {
    const logEntry = `[${new Date().toISOString()}] [SMS] TO: ${phone} | MSG: ${message}\n`;
    
    // Log to file
    fs.appendFileSync(this.logPath, logEntry);
    
    // Log to console
    logger.info(`Notification Sent to ${phone}: ${message}`);
    
    // NOTE: In production, integrate with Twilio/Msg91 here
    return true;
  }

  async sendWhatsApp(phone: string, message: string) {
    const logEntry = `[${new Date().toISOString()}] [WhatsApp] TO: ${phone} | MSG: ${message}\n`;
    fs.appendFileSync(this.logPath, logEntry);
    logger.info(`WhatsApp Sent to ${phone}: ${message}`);
    return true;
  }
}

export default new NotificationService();
