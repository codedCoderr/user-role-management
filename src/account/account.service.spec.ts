import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDTO } from './dtos';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AccountService', () => {
  let service: AccountService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    const mockCreateUserDTO: CreateUserDTO = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const mockCreatedUser = {
        id: 1,
        ...mockCreateUserDTO,
        passwordHash: hashedPassword,
      };
      delete mockCreatedUser.password;
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.registerUser(mockCreateUserDTO);

      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDTO.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          firstName: mockCreateUserDTO.firstName,
          lastName: mockCreateUserDTO.lastName,
          email: mockCreateUserDTO.email,
          passwordHash: hashedPassword,
        },
      });

      expect(result).toEqual({
        id: 1,
        firstName: mockCreateUserDTO.firstName,
        lastName: mockCreateUserDTO.lastName,
        email: mockCreateUserDTO.email,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException when a duplicate record exists', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      mockPrismaService.user.create.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(service.registerUser(mockCreateUserDTO)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw Error when a required field is missing', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      mockPrismaService.user.create.mockRejectedValue(
        new Prisma.PrismaClientValidationError('A required field is missing', {
          clientVersion: '2.0.0',
        }),
      );

      await expect(service.registerUser(mockCreateUserDTO)).rejects.toThrow(
        'A required field is missing',
      );
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    const mockEmail = 'john@example.com';
    const mockPassword = 'password123';
    const mockHashedPassword = 'hashedPassword123';

    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: 1,
        email: mockEmail,
        passwordHash: mockHashedPassword,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(mockEmail, mockPassword);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
        include: {
          roles: {
            select: {
              name: true,
            },
          },
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockPassword,
        mockHashedPassword,
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(mockEmail, mockPassword);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
        include: {
          roles: {
            select: {
              name: true,
            },
          },
        },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockUser = {
        id: 1,
        email: mockEmail,
        passwordHash: mockHashedPassword,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(mockEmail, mockPassword);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
        include: {
          roles: {
            select: {
              name: true,
            },
          },
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockPassword,
        mockHashedPassword,
      );
      expect(result).toBeNull();
    });
  });
});
