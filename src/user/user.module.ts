import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schema/user.schema';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';

@Module({
    imports:[
        ConfigModule.forRoot({
            envFilePath: '.env',
            isGlobal: true
          }),
        ClientsModule.register([
            {
              name: process.env.RABBITMQ_SERVICE_NAME,
              transport: Transport.RMQ,
              options: {
                urls: [process.env.AMQP_URI],
                queue: process.env.RABBITMQ_QUEUE_NAME
              }
            }
        ]),
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
        HttpModule, 
        MailModule    
    ],
    controllers: [UserController],
    providers: [UserService, MailService, ConfigService]
})
export class UserModule {}
