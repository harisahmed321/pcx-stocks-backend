import { Request, Response, NextFunction } from 'express';
export declare class HoldingsController {
    static createValidation: import("express-validator").ValidationChain[];
    static updateValidation: import("express-validator").ValidationChain[];
    static idValidation: import("express-validator").ValidationChain[];
    static portfolioIdValidation: import("express-validator").ValidationChain[];
    static create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static getByPortfolio(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static update(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static delete(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=holdings.controller.d.ts.map