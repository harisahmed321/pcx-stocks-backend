import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
export declare class MarketGateway {
    private io;
    constructor(httpServer: HttpServer);
    private setupRedisAdapter;
    private setupNamespaces;
    private subscribeToMarketUpdates;
    broadcastPriceUpdate(symbol: string, price: number, change: number, changePercent: number): void;
    getIO(): Server;
}
//# sourceMappingURL=marketGateway.d.ts.map