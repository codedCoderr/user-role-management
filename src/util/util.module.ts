import { Module, Global, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UtilService } from './util.service';
import { env } from 'process';
import { ResponseService } from './response.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: env.JWT_SECRET,
        signOptions: { expiresIn: env.JWT_EXPIRES_IN },
      }),
    }),
  ],
  providers: [UtilService],
  exports: [UtilService],
})
export class UtilModule {}
