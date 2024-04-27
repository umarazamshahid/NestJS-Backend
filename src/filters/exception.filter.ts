import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ExceptionHandler implements ExceptionFilter {
    constructor() {}
    async catch(error: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = error instanceof HttpException ? error.getResponse() : { message: 'Something Went Wrong' };
        Logger.error(error.stack);
        Logger.error(error.message);
        Logger.error(error.name);

        response.status(status).json({
            status: false,
            code: status,
            message: error.message || message['message'] || null,
            error: error.message,
            data: null,
        });
    }
}