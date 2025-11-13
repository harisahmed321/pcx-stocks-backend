export interface RegisterDto {
    name: string;
    email: string;
    password: string;
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface AuthResponse {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        plan: string;
    };
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private static readonly SALT_ROUNDS;
    static register(data: RegisterDto): Promise<AuthResponse>;
    static login(data: LoginDto): Promise<AuthResponse>;
    static refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    static logout(refreshToken: string): Promise<void>;
    static verifyAccessToken(token: string): Promise<{
        userId: string;
        email: string;
        role: string;
        plan: string;
    }>;
    private static generateTokens;
    private static hashToken;
}
//# sourceMappingURL=auth.service.d.ts.map