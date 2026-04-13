import express from 'express';
import planController from '../controllers/planController';
import { protect, authorize } from '../middlewares/authMiddleware';
import validate from '../middlewares/validateMiddleware';
import { createPlanSchema } from '../models/validation/planSchema';

const router = express.Router();

/**
 * @swagger
 * /api/v1/plans:
 *   get:
 *     tags: [Plans]
 *     summary: Get all membership plans
 *     responses:
 *       '200':
 *         description: List of plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Plan'
 *   post:
 *     tags: [Plans]
 *     summary: Create a new plan (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Plan'
 *     responses:
 *       '201':
 *         description: Plan created
 */
router.get('/', planController.getPlans);
router.post('/', protect, authorize('admin'), validate(createPlanSchema), planController.createPlan);

export default router;
