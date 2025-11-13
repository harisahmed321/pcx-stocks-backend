import { PrismaClient } from '@prisma/client';
declare const prismaClientSingleton: () => PrismaClient<{
    log: ({
        level: "query";
        emit: "event";
    } | {
        level: "error";
        emit: "stdout";
    } | {
        level: "warn";
        emit: "stdout";
    })[];
}, "error" | "query" | "warn", import("@prisma/client/runtime/library.js").DefaultArgs>;
declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}
export declare const prisma: PrismaClient<{
    log: ({
        level: "query";
        emit: "event";
    } | {
        level: "error";
        emit: "stdout";
    } | {
        level: "warn";
        emit: "stdout";
    })[];
}, "error" | "query" | "warn", import("@prisma/client/runtime/library.js").DefaultArgs>;
export {};
//# sourceMappingURL=client.d.ts.map