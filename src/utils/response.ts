import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: any;
  message?: string;
}

export class ResponseHelper {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    errors: any,
    message: string = 'An error occurred',
    statusCode: number = 500
  ) {
    const response: ApiResponse = {
      success: false,
      errors,
      message
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message?: string) {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static badRequest(res: Response, errors: any, message: string = 'Bad request') {
    return this.error(res, errors, message, 400);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized') {
    return this.error(res, null, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden') {
    return this.error(res, null, message, 403);
  }

  static notFound(res: Response, message: string = 'Resource not found') {
    return this.error(res, null, message, 404);
  }

  static conflict(res: Response, message: string = 'Conflict') {
    return this.error(res, null, message, 409);
  }

  static internalError(res: Response, error?: any) {
    return this.error(res, error, 'Internal server error', 500);
  }
}

// Alias for convenience
export const ApiResponse = ResponseHelper;
