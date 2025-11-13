import { Request, Response } from 'express';
export declare class SymbolsController {
    static getSymbols(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static searchSymbols(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getSymbolByCode(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getTradingSymbols(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getSymbolsBySector(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getAllSectors(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=symbols.controller.d.ts.map