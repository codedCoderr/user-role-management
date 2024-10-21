import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AccountService } from '../src/account/account.service';
import { CreateUserDTO } from '../src/account/dtos';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

jest.mock('bcryptjs');

describe('AccountController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let accountService: AccountService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    accountService = moduleFixture.get<AccountService>(AccountService);

    await app.init();
  }, 30000);

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  }, 30000);

  describe('POST /auth/register', () => {
    const validUser: CreateUserDTO = {
      firstName: 'John',
      lastName: 'Doe',
      email: faker.internet.email(),
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.firstName).toBe(validUser.firstName);
      expect(response.body.data.lastName).toBe(validUser.lastName);
      expect(response.body.data.email).toBe(validUser.email);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('passwordHash');

      const createdUser = await prismaService.user.findUnique({
        where: { email: validUser.email },
      });
      expect(createdUser).toBeDefined();
      expect(createdUser.passwordHash).toBe(hashedPassword);
    }, 30000);

    it('should return 409 when trying to register with an existing email', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUser)
        .expect(409);
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidUser = { ...validUser };
      delete invalidUser.email;
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.message).toContain('A required field is missing');
    });
  });

  describe('POST /auth/login', () => {
    let validUser = {
      email: '',
      password: '',
    };

    beforeEach(async () => {
      validUser = {
        email: faker.internet.email(),
        password: 'password123',
      };
      const hashedPassword = await bcrypt.hash(validUser.password, 10);
      await prismaService.user.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: validUser.email,
          passwordHash: hashedPassword,
        },
      });
    });

    it('should successfully login a user with valid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validUser)
        .expect(201);

      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 400 for invalid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...validUser, password: 'wrongpassword' })
        .expect(400);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 400 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(400);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('validateUser', () => {
    let user = {
      email: '',
      password: '',
    };

    beforeEach(async () => {
      user = {
        email: faker.internet.email(),
        password: 'password123',
      };
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prismaService.user.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: user.email,
          passwordHash: hashedPassword,
        },
      });
    });

    it('should return user for valid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await accountService.validateUser(
        user.email,
        user.password,
      );

      expect(result).toBeDefined();
      expect(result.email).toBe(user.email);
    });

    it('should return null for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await accountService.validateUser(
        user.email,
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const result = await accountService.validateUser(
        'nonexistent@example.com',
        user.password,
      );

      expect(result).toBeNull();
    });
  });
});
