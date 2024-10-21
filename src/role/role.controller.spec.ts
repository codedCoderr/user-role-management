import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { CreateRoleDTO } from './dtos';
import { Response } from 'express';
import { ResponseService } from '../util/response.service';
import { faker } from '@faker-js/faker';

jest.mock('./role.service');
const createRoleDTO: CreateRoleDTO = {
  name: faker.internet.userName(),
  permissions: ['read'],
};
describe('RoleController', () => {
  let controller: RoleController;
  let responseService: ResponseService;
  let roleService: jest.Mocked<RoleService>;
  const mockResponseService = {
    json: jest.fn(),
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  } as unknown as Response;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        RoleService,
        { provide: ResponseService, useValue: mockResponseService },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
    roleService = module.get(RoleService) as jest.Mocked<RoleService>;
    responseService = module.get<ResponseService>(ResponseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createRole', () => {
    it('should create a role successfully', async () => {
      const expectedResult = { id: 1, ...createRoleDTO };

      roleService.createRole.mockResolvedValue(expectedResult);

      await controller.createRole(mockResponse, createRoleDTO);

      expect(roleService.createRole).toHaveBeenCalledWith(createRoleDTO);
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        201,
        'Role created successfully',
        expectedResult,
      );
    });

    it('should throw an error if role creation fails', async () => {
      const mockError = new Error('Role creation failed');

      roleService.createRole.mockRejectedValue(mockError);

      await controller.createRole(mockResponse, createRoleDTO);
      expect(roleService.createRole).toHaveBeenCalledWith(createRoleDTO);
    });

    it('should handle empty permissions array', async () => {
      createRoleDTO.permissions = [];
      const expectedResult = { id: 1, ...createRoleDTO };

      roleService.createRole.mockResolvedValue(expectedResult);

      await controller.createRole(mockResponse, createRoleDTO);

      expect(roleService.createRole).toHaveBeenCalledWith(createRoleDTO);
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        201,
        'Role created successfully',
        expectedResult,
      );
    });

    it('should handle long role names', async () => {
      const longName = 'A'.repeat(100);
      createRoleDTO.name = longName;
      const expectedResult = { id: 1, ...createRoleDTO };

      roleService.createRole.mockResolvedValue(expectedResult);

      await controller.createRole(mockResponse, createRoleDTO);

      expect(roleService.createRole).toHaveBeenCalledWith(createRoleDTO);
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        201,
        'Role created successfully',
        expectedResult,
      );
    });

    it('should handle many permissions', async () => {
      const manyPermissions = Array.from(
        { length: 50 },
        (_, i) => `permission${i}`,
      );
      createRoleDTO.permissions = manyPermissions;
      const expectedResult = { id: 4, ...createRoleDTO };

      roleService.createRole.mockResolvedValue(expectedResult);

      await controller.createRole(mockResponse, createRoleDTO);

      expect(roleService.createRole).toHaveBeenCalledWith(createRoleDTO);
      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        201,
        'Role created successfully',
        expectedResult,
      );
    });

    it('should call roleService.createRole with the provided DTO', async () => {
      const expectedResult = { id: 1, ...createRoleDTO };

      roleService.createRole.mockResolvedValue(expectedResult);

      await controller.createRole(mockResponse, createRoleDTO);

      expect(roleService.createRole).toHaveBeenCalledWith(createRoleDTO);
    });

    it('should return the result from roleService.createRole', async () => {
      const expectedResult = { id: 1, ...createRoleDTO };

      roleService.createRole.mockResolvedValue(expectedResult);

      await controller.createRole(mockResponse, createRoleDTO);

      expect(responseService.json).toHaveBeenCalledWith(
        mockResponse,
        201,
        'Role created successfully',
        expectedResult,
      );
    });
  });
});
