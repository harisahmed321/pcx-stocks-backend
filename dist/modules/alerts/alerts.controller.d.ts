import { Request, Response, NextFunction } from 'express';
export declare class AlertsController {
    static createValidation: import("express-validator").ValidationChain[];
    static idValidation: import("express-validator").ValidationChain[];
    static create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static getAll(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static getById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static delete(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=alerts.controller.d.ts.map