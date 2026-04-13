import razorpay from '../config/razorpay';
import crypto from 'crypto';
import logger from '../utils/logger';

export class PaymentService {
  async createOrder(amount: number, receipt: string) {
    const options = {
      amount: amount * 100, // Amount in lowest currency unit (paise)
      currency: 'INR',
      receipt: receipt,
    };

    try {
      const order = await razorpay.orders.create(options);
      return order;
    } catch (error: any) {
      logger.error(`Razorpay Order Creation Error: ${error.message}`);
      throw error;
    }
  }

  verifySignature(orderId: string, paymentId: string, signature: string) {
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  }

  verifyWebhookSignature(body: string, signature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }
}

export default new PaymentService();
