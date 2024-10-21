import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super( {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },

    } );

  }
  async onModuleInit () {
    await this.$connect();
  }

  async onModuleDestroy () {
    await this.$disconnect();
  }


  //  async clearDatabase() {
  //   const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_');

  //   return Promise.all(
  //     models.map((modelKey) => this[modelKey].deleteMany())
  //   );
  // }
}
