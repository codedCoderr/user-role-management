import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { CreateRoleDTO } from '../src/role/dtos';
import { RoleService } from '../src/role/role.service';

describe('RoleController (e2e)', () => {
  let roleService: RoleService;

  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let createRoleDto: CreateRoleDTO;

  beforeEach(async () => {
    createRoleDto = {
      name: faker.internet.userName(),
      permissions: ['READ', 'WRITE', 'DELETE'],
    };
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    prismaService = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    roleService = app.get<RoleService>(RoleService);
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

  describe('createRole', () => {
    it('should throw ConflictException if role name already exists', async () => {
      const roleName = faker.internet.userName();
      const mockRole = await prismaService.role.create({
        data: {
          name: roleName,
          permissions: ['READ', 'WRITE', 'DELETE'],
        },
      });
      await request(app.getHttpServer())
        .post('/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockRole)
        .expect(409);
    });

    it('should create a role', async () => {
      const name = faker.internet.userName();
      await roleService.createRole(createRoleDto);
      await request(app.getHttpServer())
        .post('/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name,
          permissions: ['READ', 'WRITE', 'DELETE'],
        })
        .expect(201);
    });
    it('should create a role with empty permissions array', async () => {
      const name = faker.internet.userName();
      await roleService.createRole(createRoleDto);
      await request(app.getHttpServer())
        .post('/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name,
          permissions: [],
        })
        .expect(201);
    });
  });
});
