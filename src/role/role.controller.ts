import {
  Body,
  ConflictException,
  Controller,
  Post,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';

import { RoleService } from './role.service';
import { CreateRoleDTO } from './dtos';
import { AuthGuard } from '@nestjs/passport';
import { ResponseService } from '../util/response.service';

@Controller('role')
export class RoleController {
  constructor(
    private roleService: RoleService,
    private responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createRole(@Res() res: Response, @Body() body: CreateRoleDTO) {
    try {
      const role = await this.roleService.createRole(body);
      return this.responseService.json(
        res,
        201,
        'Role created successfully',
        role,
      );
    } catch (error) {
      if (error.name === 'PrismaClientKnownRequestError') {
        return this.responseService.json(
          res,
          new ConflictException('Role already exists'),
        );
      }
    }
  }
}
