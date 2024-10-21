import { Body, ConflictException, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';

// import { CurrentUser } from '@src/shared/decorators';
// import {
//   CreateUserDTO,
//   ResetPasswordDTO,
//   UpdateUserDTO,
// } from '@src/user/dto/user.dto';
import { AccountService } from './account.service';
// import { JwtAuthGuard } from '@src/clients/authentication/guards/jwt-auth.guard';
// import { UserDTO } from '../user/dtos/user.dto';
import { ResponseService } from '../util/response.service';

import { JwtService } from '@nestjs/jwt';
import { CreateUserDTO, LoginDTO } from './dtos';

@Controller('auth')
export class AccountController {
  constructor(
    private accountService: AccountService,
    private responseService: ResponseService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Res() res: Response, @Body() body: LoginDTO) {
    try {
      const user = await this.accountService.validateUser(
        body.email,
        body.password,
      );
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const payload = {
        id: user.id,
        roles: user.roles.map((role) => role.name),
      };

      const token = await this.jwtService.sign(payload);

      return this.responseService.json(res, 201, 'Login was successful', {
        token,
      });
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  }

  @Post('register')
  async register(@Res() res: Response, @Body() body: CreateUserDTO) {
    try {
      const user = await this.accountService.registerUser(body);
      return this.responseService.json(
        res,
        201,
        'User created successfully',
        user,
      );
    } catch (error) {
      if (
        error.name === 'PrismaClientKnownRequestError' &&
        error.code === 'P2002'
      ) {
        return this.responseService.json(
          res,
          new ConflictException('Email already exists'),
        );
      }
      if (error.name === 'PrismaClientValidationError') {
        return this.responseService.json(
          res,
          new Error('A required field is missing'),
        );
      }
      return this.responseService.json(res, error);
    }
  }
}
