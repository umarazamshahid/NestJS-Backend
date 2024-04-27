import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { get, isEmpty } from 'lodash';
import mongoose from 'mongoose';
import * as fs from 'fs-extra'; // fs-extra for convenience (e.g., ensuring directories)
import * as crypto from 'crypto';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ReqresUserObj } from './user.types';
import { ClientProxy } from '@nestjs/microservices';
import { MailService } from 'src/mail/mail.service';
import { ERROR_MSGS, RABBITMQ_SERVICE_NAME } from './user.constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {

    private readonly avatarDir = path.join(__dirname, '..', 'avatar'); // Adjust path as necessary
    private readonly logger = new Logger(UserService.name);
    /**
     * Constructor for UserService
     * @param userModel 
     */
    constructor(
        @Inject(RABBITMQ_SERVICE_NAME)
        private rabbitMQClient: ClientProxy,
        @InjectModel(User.name)
        private userModel: mongoose.Model<User>,
        private httpService: HttpService,
        private mailService: MailService,
    ){
        this.initializeAvatarDirectory();
    }

    /**
     * This method takes the user object,
     * creates the user in the database
     * and emits the created user through rabbitmq
     * @param user 
     * @returns { Promise<User> }
     */
    public async createUser(user: User) : Promise<User>{
        const createdUser = await this.userModel.create(user);
        this.mailService.sendMail('to@example.com', 'Welcome to Our App', 'Thank you for registering with us!');
        this.rabbitMQClient.emit('user-created', createdUser);
        return createdUser;
    }


    /**
     * Fetches a user by ID from an external API.
     * @param id The user's ID.
     * @returns {Promise<ReqresUserObj>} The user data.
     */
    public async findUserById(id: string): Promise<ReqresUserObj> {
        const url = process.env.REQRES_BASE_USERS_URL;
        const response = await firstValueFrom(this.httpService.get(url.concat(id)));
        return get(response, 'data.data');
        
    }

    /**
     * Fetches a user by ID from Database.
     * @param id The user's ID.
     * @returns {Promise<User>} The user data.
     */
    public async findUserByMongoId(id: string): Promise<User | null> {
        return this.userModel.findById(id)
    }

    /**
     * This method takes the user id as a parameter,
     * checks whether the user against the id. If it does, it takes it's avatar hash,
     * base64 encodes it and returns it.
     * If not, it then makes the avatar, saves it in the File System, and returns the 
     * base64 encoded string.
     * @param userId 
     * @returns { Promise<string> }
     */
    public async findOrCreateUserAvatar(userId: string): Promise<string>{
        const userExists =  await this.findUserByAvatar(userId);
        if(isEmpty(userExists)){
            return this.createUserAvatar(userId);
        }

        return this.convertAvatarToBase64(get(userExists, 'userAvatar'));
    }

    /**
     * This method is a helper method to findOrCreateUserAvatar() which
     * either returns the user against the id or null if not found.
     * @param userId 
     * @returns { Promise<User | null> }
     */
    private async findUserByAvatar(userId: string) : Promise<User | null>{
        const hash = this.getHash(userId);
        return this.userModel.findOne({ userAvatar: hash }).select('userAvatar');
    }
    

    /**
     * This method is a helper method to findOrCreateUserAvatar()
     * which takes the user Id as a parameter, makes the sha356 hash, updates it in the database
     * as well as saves it in the file system and returns the base64 encoded string.
     * @param userId 
     * @returns { Promise<string> }
     */

    private async createUserAvatar(userId: string): Promise<string>{
        const hash =  this.getHash(userId);
        const updatedUser = await this.userModel.findByIdAndUpdate(
            userId, 
            { $set: { userAvatar: hash } }
        );
        if(isEmpty(updatedUser)){
            throw new NotFoundException(ERROR_MSGS.USER_NOT_FOUND_OR_UPDATED)
        }
        return this.saveAvatarFile(userId, hash);
    }

    /**
     * This method takes the user id as a parameter and does following:
     * 1) It deletes the avatar file from the File System
     * 2) It removes the user avatar in the database.
     * @param userId 
     */
    public async deleteAvatar(userId: string): Promise<void>{
        const hash = this.getHash(userId);
        await this.deleteAvatarFile(userId, hash);

        await this.removeUserAvatar(userId);

    }

    /**
     * This is a helper method to deleteAvatar()
     * which takes the user id and the hash value as parameters and then 
     * deletes the avatar file from the File System
     * @param userId 
     * @param hash 
     */
    private async deleteAvatarFile(userId: string, hash: string): Promise<void> {
        const filename = `${userId}-${hash}.txt`;
        const filepath = path.join(this.avatarDir, filename);

        if (await fs.pathExists(filepath)) {
            await fs.remove(filepath);
            this.logger.log(ERROR_MSGS.AVATAR_FILE_DELETED.concat(filepath));
        } else {
            this.logger.log(ERROR_MSGS.AVATAR_FILE_NOT_FOUND.concat(filepath));
        }
    }

    /**
     * This is a helper method to deleteAvatar()
     * which takes the user id as a parameter and removes
     * the user avatar against the user id in the database
     * @param userId 
     */
    private async removeUserAvatar(userId: string): Promise<void>{

        const updatedUser = await this.userModel.findByIdAndUpdate(
            userId, 
            { $set: { userAvatar: null } }
        );
        if(isEmpty(updatedUser)){
            throw new NotFoundException(ERROR_MSGS.USER_NOT_FOUND_OR_UPDATED)
        }
    }

    /**
     * Private helper method to save the avatar file in the File System
     * @param userId 
     * @param avatarHash 
     * @returns 
     */
    private async saveAvatarFile(userId: string, avatarHash: string): Promise<string> {
        const filename = `${userId}-${avatarHash}.txt`; // Naming convention could be adjusted
        const filepath = path.join(this.avatarDir, filename);

        await fs.writeFile(filepath, avatarHash); 
        
        return this.convertAvatarToBase64(avatarHash);
    }

    /**
     * Private method to ensure that the avatar directory exists.
     */
    private async initializeAvatarDirectory() {
        await fs.ensureDir(this.avatarDir);
    }

    /**
     * Private helper method to generate hash using user id and avatarDir path
     * and return the hash.
     * @param userId 
     * @returns { string }
     */
    private getHash(userId: string): string{
        return crypto.createHash('sha256').update(userId.concat(this.avatarDir)).digest('hex')
    }

    /**
     * Private helper method to convert the hash into base64 encoded string.
     * @param hash 
     * @returns { string }
     */
    private convertAvatarToBase64(hash: string): string{
        return Buffer.from(hash).toString('base64');
    }
}

