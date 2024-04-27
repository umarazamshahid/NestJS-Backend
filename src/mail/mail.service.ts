import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';
import { MSGS } from './mail.constants';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter<SentMessageInfo>;
    private readonly logger = new Logger(MailService.name);
    /**
     * Constructor for MailService
     */
    constructor(
        private readonly configService: ConfigService
    ) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('MAIL_HOST'),
            port: this.configService.get<number>('MAIL_PORT'),
            secure: false,
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_USER_PASS'),
            }
        });
    }

    /**
     * Method to sendMail
     * @param to 
     * @param subject 
     * @param text 
     * @returns 
     */

    public async sendMail(to: string, subject: string, text: string) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: to, 
            subject: subject,
            text: text,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(MSGS.MESSAGE_SENT.concat(info.messageId));
            return info;
        } catch (error) {
            this.logger.error(MSGS.MESSAGE_SENDING_FAILED.concat(error));
            throw error;
        }
    }
}

