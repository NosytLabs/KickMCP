import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateConfig = (config: any) => {
  if (!config.kickApiKey) {
    throw new Error('Kick API key is required');
  }
  return true;
}; 