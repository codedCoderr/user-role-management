import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import { ResponseService } from '../util/response.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoleController],
  providers: [RoleService, ConfigService, ResponseService],
})
export class RoleModule {}
