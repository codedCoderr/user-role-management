import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { env } from 'process';
import { ConfigService } from '@nestjs/config';
import { ResponseService } from '../util/response.service';
import { UserService } from '../user/user.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: env.JWT_SECRET,
        signOptions: { expiresIn: env.JWT_EXPIRES_IN },
      }),
    }),
    PrismaModule,
    UserModule,
  ],
  controllers: [AccountController],
  providers: [
    AccountService,
    ResponseService,
    UserService,
    LocalStrategy,
    JwtStrategy,
    ConfigService,
  ],
})
export class AccountModule {}
