import { Body, Controller, Get, NotFoundException, Param, Post, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schema/user.schema';
import { UserDTO } from './dto/user.dto';
import { isEmpty } from 'lodash';
import { ReqresUserObj } from './user.types';
import { ERROR_MSGS } from './user.constants';

@Controller('api/user')
export class UserController {
    /**
     * Constructor for UserController, initializes UserService
     * @param userService 
     */
    constructor(
        private userService: UserService
    ){}

    /**
     * This POST method takes a user DTO as a body, creates a user in the database
     * and returns the newly created User object
     * @param user 
     * @returns { Promise<User> }
     */
    @Post()
    public async createUser(
        @Body()
        user: UserDTO
    ): Promise<User>{
        return this.userService.createUser(user)
    }

    /**
     * This GET method takes the user id as query parameter and fetches the user against it.
     * @param id 
     * @returns { Promise<ReqresUserObj> }
     */

    @Get(':id')
    public async findUserById(
        @Param('id')
        id: string
    ): Promise<ReqresUserObj>{
        const user = await this.userService.findUserById(id);
        if(isEmpty(user)){
            throw new NotFoundException(ERROR_MSGS.USER_ID_NOT_FOUND)
        }
        return user;
    }

    /**
     * This GET method takes the user id as query parameter
     * and fetches the user avatar as a base64 encoded string.
     * If there's not user avatar, it then creates the file in the File System
     * and returns the base64 encoded string.
     * @param id 
     * @returns { Promise<string> }
     */

    @Get(':id/avatar')
    public async findUserAvatar(
        @Param('id')
        id: string
    ): Promise<string>{
        const userExists = await this.userService.findUserByMongoId(id);
        if(isEmpty(userExists)){
            throw new NotFoundException(ERROR_MSGS.USER_ID_NOT_FOUND)
        }

        return this.userService.findOrCreateUserAvatar(id);
    }

    /**
     * This DELETE method takes the user id as a parameter and deletes the avatar file from the File System
     * as well as removes the user avatar from the database
     * @param id 
     */

    @Delete(':id/avatar')
    public async deleteUserAvatar(
        @Param('id')
        id: string
    ): Promise<void>{

        const userExists = await this.userService.findUserByMongoId(id);
        if(isEmpty(userExists)){
            throw new NotFoundException(ERROR_MSGS.USER_ID_NOT_FOUND)
        }

        await this.userService.deleteAvatar(id);
    }
}
