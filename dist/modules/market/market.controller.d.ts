import { Request, Response, NextFunction } from 'express';
export declare class MarketController {
    static symbolValidation: import("express-validator").ValidationChain[];
    static historyValidation: import("express-validator").ValidationChain[];
    static getSymbols(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static getCurrentPrice(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static getHistory(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static getSymbolDetails(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=market.controller.d.ts.map