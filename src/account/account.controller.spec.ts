import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { ResponseService } from '../util/response.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDTO, LoginDTO } from './dtos';
import { Response } from 'express';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AccountController', () => {
  let controller: AccountController;
  let accountService: AccountService;
  let responseService: ResponseService;
  let jwtService: JwtService;

  const mockAccountService = {
    validateUser: jest.fn(),
    registerUser: jest.fn(),
  };

  const mockResponseService = {
    json: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        { provide: AccountService, useValue: mockAccountService },
        { provide: ResponseService, useValue: mockResponseService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    accountService = module.get<AccountService>(AccountService);
    responseService = module.get<ResponseService>(ResponseService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const mockLoginDTO: LoginDTO = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      roles: [{ name: 'user' }],
    };

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    it('should successfully login a user', async () => {
      mockAccountService.validateUser.mockResolvedValue(mockUser);
      mockJwtService.sign.mockResolvedValue('mock_token');

      await controller.login(mockResponse, mockLoginDTO);

      expect(accountService.validateUser).toHaveBeenCalledWith(
        mockLoginDTO.email,
        mockLoginDTO.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        roles: ['user'],
      });
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        201,
        'Login was successful',
        { token: 'mock_token' },
      );
    });

    it('should return 400 for invalid credentials', async () => {
      mockAccountService.validateUser.mockResolvedValue(null);

      await controller.login(mockResponse, mockLoginDTO);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid credentials',
      });
    });

    it('should handle errors during login', async () => {
      const mockError = new Error('Test error');
      mockAccountService.validateUser.mockRejectedValue(mockError);

      await controller.login(mockResponse, mockLoginDTO);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Test error' });
    });

    it('should handle UnauthorizedException during login', async () => {
      const mockError = new UnauthorizedException('Invalid credentials');
      mockAccountService.validateUser.mockRejectedValue(mockError);

      await controller.login(mockResponse, mockLoginDTO);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: 'Invalid credentials',
      });
    });
  });

  describe('register', () => {
    const mockCreateUserDTO: CreateUserDTO = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;

    it('should successfully register a new user', async () => {
      const mockCreatedUser = { id: 1, ...mockCreateUserDTO };
      mockAccountService.registerUser.mockResolvedValue(mockCreatedUser);

      await controller.register(mockResponse, mockCreateUserDTO);

      expect(accountService.registerUser).toHaveBeenCalledWith(
        mockCreateUserDTO,
      );
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        201,
        'User created successfully',
        mockCreatedUser,
      );
    });

    it('should handle ConflictException during registration', async () => {
      const mockError = new ConflictException('Email already exists');
      mockAccountService.registerUser.mockRejectedValue(mockError);

      await controller.register(mockResponse, mockCreateUserDTO);

      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        mockError,
      );
    });

    it('should handle other errors during registration', async () => {
      const mockError = new Error('Internal server error');
      mockAccountService.registerUser.mockRejectedValue(mockError);

      await controller.register(mockResponse, mockCreateUserDTO);

      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        mockError,
      );
    });

    it('should handle Prisma unique constraint violation', async () => {
      const mockError: any = new Error(
        'Unique constraint failed on the fields: (`email`)',
      );
      mockError.name = 'PrismaClientKnownRequestError';
      mockError.code = 'P2002';
      mockAccountService.registerUser.mockRejectedValue(mockError);

      await controller.register(mockResponse, mockCreateUserDTO);

      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          status: 409,
          message: 'Email already exists',
        }),
      );
    });
  });
});
