import { Request, Response } from 'express';
import paymentService from '../services/paymentService';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import User from '../models/User';
import Coupon from '../models/Coupon';
import { successResponse, errorResponse } from '../utils/apiResponse';
import logger from '../utils/logger';

export class PaymentController {
  /**
   * @swagger
   * /api/v1/payments/create-order:
   *   post:
   *     tags: [Payments]
   *     summary: Create Razorpay order
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [planId]
   *             properties:
   *               planId: { type: string }
   *               couponCode: { type: string, example: 'OFFER10' }
   *     responses:
   *       '200':
   *         description: Order created
   */
  async checkout(req: any, res: Response) {
    try {
      const { planId, couponCode } = req.body;
      const userId = req.user.id;

      const plan = await Plan.findById(planId);
      if (!plan || !plan.isActive) {
        return errorResponse(res, 'Invalid or inactive plan', 400);
      }

      let finalPrice = plan.price;
      let appliedCoupon = null;

      // Coupon Validation
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
        
        if (!coupon) {
          return errorResponse(res, 'Invalid or expired coupon code', 400);
        }

        if (coupon.expiryDate < new Date()) {
          coupon.isActive = false;
          await coupon.save();
          return errorResponse(res, 'Coupon has expired', 400);
        }

        if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
          return errorResponse(res, 'Coupon usage limit reached', 400);
        }

        // Apply discount
        const discount = (plan.price * coupon.discountPercent) / 100;
        finalPrice = plan.price - (coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount);
        
        appliedCoupon = coupon;
      }

      // Create Razorpay Order
      const order = await paymentService.createOrder(finalPrice, `receipt_${userId}_${Date.now()}`);

      // Save pending subscription
      await Subscription.create({
        userId,
        planId,
        amount: finalPrice,
        razorpayOrderId: order.id,
        status: 'pending',
      });

      // Increment coupon usage if order created
      if (appliedCoupon) {
        appliedCoupon.usageCount += 1;
        await appliedCoupon.save();
      }

      logger.info(`Checkout initiated for user ${userId} with plan ${planId}. Final Price: ${finalPrice}`);

      return successResponse(res, 'Order created successfully', {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        discountedAmount: finalPrice < plan.price ? finalPrice : undefined
      });
    } catch (error: any) {
      logger.error(`Checkout Error: ${error.message}`);
      return errorResponse(res, 'Failed to initiate checkout', 500);
    }
  }

  async verifyPayment(req: any, res: Response) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const isVerified = paymentService.verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isVerified) {
        return errorResponse(res, 'Invalid payment signature', 400);
      }

      // Update Subscription
      const subscription = await Subscription.findOne({ razorpayOrderId: razorpay_order_id });
      if (!subscription) {
        return errorResponse(res, 'Subscription record not found', 404);
      }

      const plan = await Plan.findById(subscription.planId);
      if (!plan) return errorResponse(res, 'Plan not found', 404);

      subscription.status = 'active';
      subscription.razorpayPaymentId = razorpay_payment_id;
      subscription.razorpaySignature = razorpay_signature;
      subscription.startDate = new Date();
      subscription.endDate = new Date(Date.now() + plan.durationInMonths * 30 * 24 * 60 * 60 * 1000);
      await subscription.save();

      // Update User Membership Status
      await User.findByIdAndUpdate(subscription.userId, { membershipStatus: 'active' });

      logger.info(`Payment verified for order: ${razorpay_order_id}`);
      return successResponse(res, 'Payment verified and membership activated', subscription);
    } catch (error: any) {
      logger.error(`Payment Verification Error: ${error.message}`);
      return errorResponse(res, 'Failed to verify payment', 500);
    }
  }

  async webhook(req: Request, res: Response) {
    // Razorpay Webhook for async payment confirmation
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const isValid = paymentService.verifyWebhookSignature(JSON.stringify(req.body), signature);

      if (!isValid) {
        logger.warn('Invalid Webhook Signature');
        return res.status(400).send('Invalid Signature');
      }

      const event = req.body.event;
      if (event === 'payment.captured') {
        const payload = req.body.payload.payment.entity;
        const orderId = payload.order_id;

        const subscription = await Subscription.findOne({ razorpayOrderId: orderId });
        if (subscription && subscription.status !== 'active') {
          const plan = await Plan.findById(subscription.planId);
          if (plan) {
            subscription.status = 'active';
            subscription.startDate = new Date();
            subscription.endDate = new Date(Date.now() + plan.durationInMonths * 30 * 24 * 60 * 60 * 1000);
            await subscription.save();
            await User.findByIdAndUpdate(subscription.userId, { membershipStatus: 'active' });
            logger.info(`Webhook: Subscription activated for order ${orderId}`);
          }
        }
      }

      return res.status(200).send('Webhook processed');
    } catch (error: any) {
      logger.error(`Webhook Error: ${error.message}`);
      return res.status(500).send('Webhook processing failed');
    }
  }
}

export default new PaymentController();
