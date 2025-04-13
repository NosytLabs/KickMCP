import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export const validateRequest = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.required && (value === undefined || value === null)) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rule.type && typeof value !== rule.type) {
          errors.push(`${rule.field} must be of type ${rule.type}`);
        }

        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must not exceed ${rule.maxLength} characters`);
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${rule.field} does not match the required pattern`);
        }
      }
    }

    if (errors.length > 0) {
      logger.warn('Validation errors:', errors);
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errors
        }
      });
    }

    next();
  };
}; 