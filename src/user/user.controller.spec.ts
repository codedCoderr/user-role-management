import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../account/guards/role.guard';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;
  const userId = 1;
  const roleName = 'admin';
  beforeEach(async () => {
    const mockUserService = {
      findAll: jest.fn(),
      assignRole: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          passwordHash: 'hashedpassword',
          createdAt: new Date(),
          roles: [{ name: 'user', id: 1, permissions: ['read'] }],
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          passwordHash: 'hashedpassword',
          createdAt: new Date(),
          roles: [{ name: 'admin', id: 2, permissions: ['read', 'write'] }],
        },
      ];
      userService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toEqual(result);
      expect(userService.findAll).toHaveBeenCalled();
    });

    it('should return an empty array when no users are found', async () => {
      const result = [];
      userService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toEqual([]);
      expect(userService.findAll).toHaveBeenCalled();
    });

    it('should throw an error if userService.findAll fails', async () => {
      const error = new Error('Database error');
      userService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow('Database error');
      expect(userService.findAll).toHaveBeenCalled();
    });
  });

  describe('assignRole', () => {
    it('should assign a role to a user', async () => {
      const result = { message: 'Role assigned successfully' };
      userService.assignRole.mockResolvedValue(result);

      expect(await controller.assignRole(userId, { roleName })).toEqual(result);
      expect(userService.assignRole).toHaveBeenCalledWith(userId, roleName);
    });

    it('should throw an error if userService.assignRole fails', async () => {
      const error = new Error('Invalid role');
      userService.assignRole.mockRejectedValue(error);

      await expect(controller.assignRole(userId, { roleName })).rejects.toThrow(
        'Invalid role',
      );
      expect(userService.assignRole).toHaveBeenCalledWith(userId, roleName);
    });

    it('should handle non-existent user', async () => {
      const error = new Error('User not found');
      userService.assignRole.mockRejectedValue(error);

      await expect(controller.assignRole(userId, { roleName })).rejects.toThrow(
        'User not found',
      );
      expect(userService.assignRole).toHaveBeenCalledWith(userId, roleName);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      userService.remove.mockResolvedValue(undefined);

      expect(await controller.remove(userId)).toEqual(undefined);
      expect(userService.remove).toHaveBeenCalledWith(userId);
    });

    it('should throw an error if userService.remove fails', async () => {
      const error = new Error('User not found');
      userService.remove.mockRejectedValue(error);

      await expect(controller.remove(userId)).rejects.toThrow('User not found');
      expect(userService.remove).toHaveBeenCalledWith(userId);
    });

    it('should handle attempt to remove non-existent user', async () => {
      const error = new Error('User not found');
      userService.remove.mockRejectedValue(error);

      await expect(controller.remove(userId)).rejects.toThrow('User not found');
      expect(userService.remove).toHaveBeenCalledWith(userId);
    });
  });
});
