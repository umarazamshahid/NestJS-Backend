import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { NotFoundException } from '@nestjs/common';
import { UserDTO } from './dto/user.dto';
import { User } from './schema/user.schema';
import { ERROR_MSGS } from './user.constants';
import { UserType } from './schema/user.schema.types';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            createUser: jest.fn(),
            findUserById: jest.fn(),
            findOrCreateUserAvatar: jest.fn(),
            deleteAvatar: jest.fn()
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  describe('createUser', () => {
    it('should create a user and return the user object', async () => {
      const userDTO: UserDTO = { 
        userName: "test name",
        userEmail: "testEmail@example.com",
        userAddress: "test address",
        userCell: "01231344131",
        userType: UserType.STANDARD,
        userAvatar: "abc123"

       };
      const expectedUser: User = { 
        userName: "Elaine Tillman",
        userEmail: "Ressie49@hotmail.com",
        userAddress: "057 Schowalter Ridges",
        userCell: "701-573-2255",
        userType: UserType.ADMIN,
        userAvatar: null,
       };

      jest.spyOn(userService, 'createUser').mockResolvedValue(expectedUser);

      expect(await controller.createUser(userDTO)).toBe(expectedUser);
      expect(userService.createUser).toHaveBeenCalledWith(userDTO);
    });
  });

  describe('findUserById', () => {
    it('should return user object if found', async () => {
      const userId = 'someUserId';
      const expectedUser = { 
        id: 123,
        email: "testEmail@example.com",
        first_name: "John",
        last_name: "Doe",
        avatar: "123abc"
       };

      jest.spyOn(userService, 'findUserById').mockResolvedValue(expectedUser);

      expect(await controller.findUserById(userId)).toBe(expectedUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const userId = 'someUserId';
      jest.spyOn(userService, 'findUserById').mockResolvedValue(null);

      await expect(controller.findUserById(userId)).rejects.toThrow(new NotFoundException(ERROR_MSGS.USER_ID_NOT_FOUND));
    });
  });

  describe('findUserAvatar', () => {
    it('should return base64 encoded avatar string if user exists', async () => {
      const userId = 'someUserId';
      const expectedAvatar = 'base64string';
      jest.spyOn(userService, 'findUserById').mockResolvedValue({ 
        id: 123,
        email: "testEmail@example.com",
        first_name: "John",
        last_name: "Doe",
        avatar: "123abc"
       });
      jest.spyOn(userService, 'findOrCreateUserAvatar').mockResolvedValue(expectedAvatar);

      expect(await controller.findUserAvatar(userId)).toBe(expectedAvatar);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'someUserId';
      jest.spyOn(userService, 'findUserById').mockResolvedValue(null);

      await expect(controller.findUserAvatar(userId)).rejects.toThrow(new NotFoundException(ERROR_MSGS.USER_ID_NOT_FOUND));
    });
  });

  describe('deleteUserAvatar', () => {
    it('should delete the user avatar if user exists', async () => {
      const userId = 'someUserId';
      jest.spyOn(userService, 'findUserById').mockResolvedValue({ 
        id: 123,
        email: "testEmail@example.com",
        first_name: "John",
        last_name: "Doe",
        avatar: "123abc"
       });
      jest.spyOn(userService, 'deleteAvatar').mockResolvedValue();

      await controller.deleteUserAvatar(userId);

      expect(userService.deleteAvatar).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'someUserId';
      jest.spyOn(userService, 'findUserById').mockResolvedValue(null);

      await expect(controller.deleteUserAvatar(userId)).rejects.toThrow(new NotFoundException(ERROR_MSGS.USER_ID_NOT_FOUND));
    });
  });
});
