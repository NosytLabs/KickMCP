// Global type declarations for modules without @types packages

declare module 'express-rate-limit' {
  import { Request, Response, NextFunction } from 'express';
  
  interface Options {
    windowMs?: number;
    max?: number;
    message?: string | object;
    statusCode?: number;
    headers?: boolean;
    skipFailedRequests?: boolean;
    skipSuccessfulRequests?: boolean;
    requestWasSuccessful?: (req: Request, res: Response) => boolean;
    skip?: (req: Request, res: Response) => boolean;
    keyGenerator?: (req: Request, res: Response) => string;
    handler?: (req: Request, res: Response, next: NextFunction) => void;
    onLimitReached?: (req: Request, res: Response, optionsUsed: Options) => void;
  }

  function rateLimit(options?: Options): (req: Request, res: Response, next: NextFunction) => void;
  export = rateLimit;
}

// Add any other module declarations here if needed 