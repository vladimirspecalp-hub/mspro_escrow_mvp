import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { RegisterDto, LoginDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    phone: string | null;
    role: UserRole;
    kycStatus: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone || null,
        role: UserRole.USER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        kycStatus: true,
      },
    });

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken,
      user,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        kycStatus: user.kycStatus,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        kycStatus: true,
        password: true,
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  private generateToken(userId: number, email: string, role: UserRole): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  async refreshSession(userId: number): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        kycStatus: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken,
      user,
    };
  }
}
