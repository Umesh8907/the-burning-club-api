import { Request, Response } from 'express';
import Plan from '../models/Plan';
import { successResponse, errorResponse } from '../utils/apiResponse';

export class PlanController {
  async createPlan(req: Request, res: Response) {
    try {
      const plan = await Plan.create(req.body);
      return successResponse(res, 'Plan created successfully', plan, 201);
    } catch (error: any) {
      return errorResponse(res, 'Failed to create plan', 500, error.message);
    }
  }

  async getPlans(req: Request, res: Response) {
    try {
      const plans = await Plan.find({ isActive: true });
      return successResponse(res, 'Plans retrieved successfully', plans);
    } catch (error: any) {
      return errorResponse(res, 'Failed to retrieve plans', 500);
    }
  }
}

export default new PlanController();
