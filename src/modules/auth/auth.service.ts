import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client.js';
import { config } from '../../config/index.js';
import { AppError } from '../../utils/errorHandler.js';
import crypto from 'crypto';

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

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  static async register(data: RegisterDto): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(data: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };

      // Hash the token for comparison
      const tokenHash = this.hashToken(refreshToken);

      // Check if token exists and is not revoked
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          userId: decoded.userId,
          tokenHash,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!storedToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });

      // Generate new tokens
      return await this.generateTokens(decoded.userId);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  static async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  static async verifyAccessToken(token: string): Promise<{ userId: string; email: string; role: string; plan: string }> {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as any;

      // Fetch fresh user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, plan: true },
      });

      if (!user) {
        throw new AppError('User not found', 401);
      }

      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
      };
    } catch (error) {
      throw new AppError('Invalid access token', 401);
    }
  }

  private static async generateTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Get user for token payload
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, plan: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId: user.id,
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );

    // Store refresh token hash
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

