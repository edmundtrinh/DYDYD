import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { Errors } from './errorHandler';

/**
 * Validation middleware factory
 * Runs validations and returns errors if any
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors: Record<string, string[]> = {};
    errors.array().forEach((error) => {
      if (error.type === 'field') {
        const field = error.path;
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(error.msg);
      }
    });

    next(Errors.validationError(formattedErrors));
  };
};
