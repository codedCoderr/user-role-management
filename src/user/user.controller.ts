import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../account/guards/role.enum';
import { RolesGuard } from '../account/guards/role.guard';
import { UserService } from './user.service';
import { Roles } from '../shared';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/assign-role')
  async assignRole(
    @Param('id') userId: number,
    @Body() body: { roleName: string },
  ) {
    return this.userService.assignRole(userId, body.roleName);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: number) {
    try {
      await this.userService.remove(+id);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          'An error occurred while deleting the user',
        );
      }
    }
  }
}
