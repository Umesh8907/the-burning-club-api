import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { errorResponse } from '../utils/apiResponse';

const validate = (schema: z.ZodObject<any, any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation Error', 400, error.issues.map(e => e.message));
    }
    return errorResponse(res, 'Internal Server Error during validation', 500);
  }
};

export default validate;
