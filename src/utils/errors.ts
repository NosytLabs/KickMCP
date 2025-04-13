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