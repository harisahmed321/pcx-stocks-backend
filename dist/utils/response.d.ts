import { Response } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    errors?: any;
    message?: string;
}
export declare class ResponseHelper {
    static success<T>(res: Response, data: T, message?: string, statusCode?: number): Response<any, Record<string, any>>;
    static error(res: Response, errors: any, message?: string, statusCode?: number): Response<any, Record<string, any>>;
    static created<T>(res: Response, data: T, message?: string): Response<any, Record<string, any>>;
    static noContent(res: Response): Response<any, Record<string, any>>;
    static badRequest(res: Response, errors: any, message?: string): Response<any, Record<string, any>>;
    static unauthorized(res: Response, message?: string): Response<any, Record<string, any>>;
    static forbidden(res: Response, message?: string): Response<any, Record<string, any>>;
    static notFound(res: Response, message?: string): Response<any, Record<string, any>>;
    static conflict(res: Response, message?: string): Response<any, Record<string, any>>;
    static internalError(res: Response, error?: any): Response<any, Record<string, any>>;
}
export declare const ApiResponse: typeof ResponseHelper;
//# sourceMappingURL=response.d.ts.map