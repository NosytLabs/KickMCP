export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class KickApiError extends AppError {
  constructor(
    message: string,
    public statusCode = 500,
    public isOperational = true
  ) {
    super(statusCode, message, isOperational);
    this.name = 'KickApiError';
  }
}

export const errorHandler = (err: Error, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        status: err.statusCode
      }
    });
  }

  return res.status(500).json({
    error: {
      message: 'Internal Server Error',
      status: 500
    }
  });
}; 