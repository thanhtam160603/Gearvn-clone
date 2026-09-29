import { type ExceptionFilter, Catch, Logger, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import type { RequestWithId } from '../http/request-id.middleware';

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
    private readonly logger = new Logger(ApiErrorFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const context = host.switchToHttp();
        const request = context.getRequest<RequestWithId>();
        const response = context.getResponse<Response>();

        const statusCode =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;
        const raw = 
            exception instanceof HttpException ? exception.getResponse() : undefined;
        const body = 
            typeof raw === 'object' && raw !== null
                ? (raw as Record<string, unknown>)
                : {};
        
        if (statusCode >= 500) {
            this.logger.error({
                requestId: request.requestId,
                path: request.path,
                exception,
            })
        }

        response.status(statusCode).json({
            statusCode,
            code: 
                typeof body.code === "string"
                    ? body.code
                    : statusCode === 400
                        ? "VALIDATION_ERROR"
                        : statusCode >= 500
                            ? "INTERNAL_SERVER_ERROR"
                            : "HTTP_ERROR",
            message:
                statusCode >= 500
                    ? "Internal server error"
                    : typeof body.message === "string"
                        ? body.message
                        : "An error occurred",
            requestId: request.requestId,
            details: Array.isArray(body.details) ? body.details : [],

        })
        
    }
}
