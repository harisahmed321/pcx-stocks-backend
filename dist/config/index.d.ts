export declare const config: {
    env: string;
    port: number;
    apiVersion: string;
    database: {
        url: string;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiry: string;
        refreshExpiry: string;
    };
    cors: {
        origin: string[];
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    marketData: {
        provider: string;
        apiKey: string;
    };
    logging: {
        level: string;
    };
    socketIO: {
        corsOrigin: string;
    };
};
//# sourceMappingURL=index.d.ts.map