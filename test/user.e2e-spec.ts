import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from '../src/account/guards/role.guard';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let authToken: string;

  const mockRoleGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = { id: 1, roles: ['admin'] };
      return true;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(RolesGuard)
      .useValue(mockRoleGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    prismaService = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    await app.init();

    const mockUser = await prismaService.user.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: faker.internet.email(),
        passwordHash: 'mockpassword',
      },
    });

    authToken = jwtService.sign({ userId: mockUser.id, roles: ['admin'] });
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('/user (GET)', () => {
    it('should return all users', async () => {
      await prismaService.user.createMany({
        data: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: faker.internet.email(),
            passwordHash: 'password123',
          },
          {
            firstName: 'John',
            lastName: 'Doe',
            email: faker.internet.email(),
            passwordHash: 'password123',
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('email', response.body[0].email);
      expect(response.body[1]).toHaveProperty('email', response.body[1].email);
    });
  });

  describe('/user/:id/assign-role (POST)', () => {
    it('should assign a role to a user', async () => {
      const user = await prismaService.user.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: faker.internet.email(),
          passwordHash: 'password123',
        },
      });
      const roleName = faker.internet.userName();
      await prismaService.role.create({
        data: { name: roleName },
      });

      const response = await request(app.getHttpServer())
        .post(`/user/${user.id}/assign-role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ roleName });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'Role assigned successfully' });

      const updatedUser = await prismaService.user.findUnique({
        where: { id: user.id },
        include: { roles: true },
      });
      expect(updatedUser.roles).toHaveLength(1);
      expect(updatedUser.roles[0].name).toBe(roleName);
    });

    it('should return 404 when user is not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/user/999/assign-role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ roleName: 'admin' });

      expect(response.status).toBe(404);
    });

    it('should return 404 when role is not found', async () => {
      const user = await prismaService.user.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: faker.internet.email(),
          passwordHash: 'password123',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/user/${user.id}/assign-role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ roleName: 'NONEXISTENT_ROLE' });

      expect(response.status).toBe(404);
    });
  });

  describe('/user/:id (DELETE)', () => {
    it('should delete a user', async () => {
      const user = await prismaService.user.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: faker.internet.email(),
          passwordHash: 'password123',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/user/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      const deletedUser = await prismaService.user.findUnique({
        where: { id: user.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should return 404 when trying to delete a non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .delete('/user/999')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });
});
