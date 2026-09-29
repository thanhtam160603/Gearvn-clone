import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";

import { ApiErrorFilter } from "./errors/api-error.filter";

type HttpAppOptions = {
    frontendOrigin: string;
    globalPrefix?: string;
};

export function configureHttpApp(
    app: INestApplication,
    options: HttpAppOptions,
): void {
    app.use(helmet());
    app.enableCors({
        origin: options.frontendOrigin,
        credentials: true,
    });
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        })
    );
    app.useGlobalFilters(new ApiErrorFilter());

    if (options.globalPrefix) {
        app.setGlobalPrefix(options.globalPrefix);
    }
}