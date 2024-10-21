import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDTO } from './dtos';
import { Role } from '@prisma/client';

// Mock PrismaService
const mockPrismaService = {
  role: {
    create: jest.fn(),
  },
};
const createRoleDto: CreateRoleDTO = {
  name: 'Admin',
  permissions: ['READ', 'WRITE', 'DELETE'],
};
describe('RoleService', () => {
  let roleService: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    roleService = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  type TestRole = Role & {
    createdAt: Date;
    updatedAt: Date;
  };
  describe('createRole', () => {
    it('should create a role with valid input', async () => {
      const expectedRole: TestRole = {
        id: 1,
        ...createRoleDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.role.create.mockResolvedValue(expectedRole);

      const result = await roleService.createRole(createRoleDto);

      expect(result).toEqual(expectedRole);
      expect(mockPrismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: createRoleDto.name,
          permissions: createRoleDto.permissions,
        },
      });
    });

    it('should create a role with minimum required fields', async () => {
      createRoleDto.permissions = [];
      const expectedRole: TestRole = {
        id: 2,
        ...createRoleDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.role.create.mockResolvedValue(expectedRole);

      const result = await roleService.createRole(createRoleDto);

      expect(result).toEqual(expectedRole);
      expect(mockPrismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: createRoleDto.name,
          permissions: createRoleDto.permissions,
        },
      });
    });

    it('should throw an error if PrismaService fails', async () => {
      const errorMessage = 'Database error';
      mockPrismaService.role.create.mockRejectedValue(new Error(errorMessage));

      await expect(roleService.createRole(createRoleDto)).rejects.toThrow(
        errorMessage,
      );
      expect(mockPrismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: createRoleDto.name,
          permissions: createRoleDto.permissions,
        },
      });
    });

    it('should handle long role names', async () => {
      const longName = 'A'.repeat(255); // Assuming 255 is the maximum allowed length

      createRoleDto.name = longName;
      const expectedRole: TestRole = {
        id: 3,
        ...createRoleDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.role.create.mockResolvedValue(expectedRole);

      const result = await roleService.createRole(createRoleDto);

      expect(result).toEqual(expectedRole);
      expect(mockPrismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: createRoleDto.name,
          permissions: createRoleDto.permissions,
        },
      });
    });

    it('should handle a large number of permissions', async () => {
      const manyPermissions = Array.from(
        { length: 100 },
        (_, i) => `PERMISSION_${i}`,
      );
      createRoleDto.permissions = manyPermissions;
      const expectedRole: TestRole = {
        id: 4,
        ...createRoleDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.role.create.mockResolvedValue(expectedRole);

      const result = await roleService.createRole(createRoleDto);

      expect(result).toEqual(expectedRole);
      expect(mockPrismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: createRoleDto.name,
          permissions: createRoleDto.permissions,
        },
      });
    });

    it('should handle special characters in role name', async () => {
      const specialName = 'Spécial-Rôle!@#$%^&*()';
      createRoleDto.name = specialName;
      const expectedRole: TestRole = {
        id: 5,
        ...createRoleDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.role.create.mockResolvedValue(expectedRole);

      const result = await roleService.createRole(createRoleDto);

      expect(result).toEqual(expectedRole);
      expect(mockPrismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: createRoleDto.name,
          permissions: createRoleDto.permissions,
        },
      });
    });
  });
});
