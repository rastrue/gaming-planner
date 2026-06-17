export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(errors: Array<{ field: string; message: string }>) {
    super(400, 'Ошибка валидации', errors);
    this.name = 'ValidationError';
  }
}
