export declare class SymbolsService {
    static getSymbols(query?: string, limit?: number): Promise<{
        symbol: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sectorName: string | null;
        isETF: boolean;
        isDebt: boolean;
        url: string;
    }[]>;
    static searchSymbols(query: string, limit?: number): Promise<{
        symbol: string;
        name: string;
        id: string;
        sectorName: string | null;
        isETF: boolean;
        url: string;
    }[]>;
    static getSymbolByCode(symbol: string): Promise<{
        symbol: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sectorName: string | null;
        isETF: boolean;
        isDebt: boolean;
        url: string;
    } | null>;
    static getTradingSymbols(): Promise<{
        symbol: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sectorName: string | null;
        isETF: boolean;
        isDebt: boolean;
        url: string;
    }[]>;
    static getSymbolsBySector(sector: string): Promise<{
        symbol: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sectorName: string | null;
        isETF: boolean;
        isDebt: boolean;
        url: string;
    }[]>;
    static getAllSectors(): Promise<{
        name: string | null;
        count: number;
    }[]>;
}
//# sourceMappingURL=symbols.service.d.ts.map