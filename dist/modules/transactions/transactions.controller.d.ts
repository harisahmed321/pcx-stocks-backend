import { Request, Response, NextFunction } from 'express';
export declare class TransactionsController {
    static createValidation: import("express-validator").ValidationChain[];
    static portfolioIdValidation: import("express-validator").ValidationChain[];
    static create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static getByPortfolio(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=transactions.controller.d.ts.map