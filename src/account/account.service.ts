import { Injectable } from '@nestjs/common';
import { CreateUserDTO } from './dtos';
import * as bcrypt from 'bcryptjs';
// import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}
  async registerUser(body: CreateUserDTO) {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const createdUser = await this.prisma.user.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        passwordHash: hashedPassword,
      },
    });
    delete createdUser.passwordHash;
    return createdUser;
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return null;
    }
    return user;
  }
}
