import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDTO } from './dtos';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async createRole(body: CreateRoleDTO) {
    const role = await this.prisma.role.create({
      data: {
        name: body.name,
        permissions: body.permissions,
      },
    });

    return role;
  }
}
