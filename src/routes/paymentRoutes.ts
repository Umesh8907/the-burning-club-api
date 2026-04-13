import express from 'express';
import paymentController from '../controllers/paymentController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

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
 *     responses:
 *       '200':
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId: { type: string }
 *                     amount: { type: number }
 *                     currency: { type: string }
 *                     keyId: { type: string }
 */
router.post('/create-order', protect, paymentController.checkout);

/**
 * @swagger
 * /api/v1/payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify payment signature
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               razorpay_order_id: { type: string }
 *               razorpay_payment_id: { type: string }
 *               razorpay_signature: { type: string }
 *     responses:
 *       '200':
 *         description: Payment verified
 */
router.post('/verify', protect, paymentController.verifyPayment);

/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Razorpay webhook listener
 *     responses:
 *       '200':
 *         description: Webhook received
 */
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

export default router;
