import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({ include: { roles: true } });
  }

  async assignRole(userId: number, roleName: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: Number(userId) },
    });
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!user || !role) {
      throw new NotFoundException('User or role not found');
    }

    await this.prisma.user.update({
      where: { id: Number(userId) },
      data: { roles: { connect: { name: roleName } } },
    });

    return { message: 'Role assigned successfully' };
  }

  async remove(id: number) {
    try {
      const user = await this.prisma.user.delete({
        where: { id },
      });
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }
}
