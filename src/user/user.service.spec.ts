import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;
  const mockUsers = [
    {
      id: 1,
      email: faker.internet.email(),
      firstName: 'John',
      lastName: 'Doe',
      roles: [{ id: 1, name: 'user' }],
    },
    {
      id: 2,
      firstName: 'John',
      lastName: 'Doe',
      email: faker.internet.email(),
      roles: [{ id: 2, name: 'admin' }],
    },
  ];
  const mockRole = { id: 1, name: 'admin' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            role: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUsers[0],
      );

      const result = await service.findByEmail(mockUsers[0].email);
      expect(result).toEqual(mockUsers[0]);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUsers[0].email },
      });
    });

    it('should return null when user is not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users with their roles', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.findAll();
      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        include: { roles: true },
      });
    });

    it('should return an empty array when no users are found', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('assignRole', () => {
    it('should assign a role to a user successfully', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUsers[0],
      );
      (prismaService.role.findUnique as jest.Mock).mockResolvedValue(mockRole);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUsers[0],
        roles: [mockRole],
      });

      const result = await service.assignRole(1, 'admin');
      expect(result).toEqual({ message: 'Role assigned successfully' });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'admin' },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { roles: { connect: { name: 'admin' } } },
      });
    });

    it('should throw NotFoundException when user is not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.role.findUnique as jest.Mock).mockResolvedValue(mockRole);

      await expect(service.assignRole(999, 'admin')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when role is not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUsers[0],
      );
      (prismaService.role.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.assignRole(1, 'NONEXISTENT_ROLE')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUsers[0]);

      const result = await service.remove(1);
      expect(result).toEqual(mockUsers[0]);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw an error when user is not found', async () => {
      (prismaService.user.delete as jest.Mock).mockRejectedValue(
        new Error('User not found'),
      );

      await expect(service.remove(999)).rejects.toThrow('User not found');
    });
  });
});
