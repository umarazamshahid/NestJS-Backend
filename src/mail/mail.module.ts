import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports:[
        ConfigModule.forRoot({
            envFilePath: '.env',
            isGlobal: true
          }),
    ],
    controllers: [],
    providers: [MailService]
})
export class MailModule {}
