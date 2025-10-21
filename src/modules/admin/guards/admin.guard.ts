import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const adminId = request.body?.adminId || request.query?.adminId;

    if (!adminId) {
      throw new ForbiddenException('Admin ID is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(adminId, 10) },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      throw new ForbiddenException('Access denied: Admin or Moderator role required');
    }

    request.admin = user;
    return true;
  }
}
