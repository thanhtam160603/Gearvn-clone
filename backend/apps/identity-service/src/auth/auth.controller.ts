import {Body, Controller, Post, Req, Res, HttpCode} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';
import type { AuthResult } from './auth.types';

type RequestWithCookies = Request & {
    cookies?: Record<string, string | undefined >;
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(
        @Body() registerDTO: RegisterDTO,
        @Res({ passthrough: true }) response: Response,
    ) {
        const result = await this.authService.register(registerDTO);
        return this.withRefreshCookie(response, result);
    }

    @Post('login')
    async login(
        @Body() loginDTO: LoginDTO,
        @Res({ passthrough: true }) response: Response,
    ) {
        const result = await this.authService.login(loginDTO);
        return this.withRefreshCookie(response, result);
    }
    
    @Post("refresh")
    async refresh(
        @Req() request: RequestWithCookies,
        @Res({ passthrough: true }) response: Response,
    ) {
        const result = await this.authService.refresh(
        request.cookies?.refreshToken ?? "",
        );

        return this.withRefreshCookie(response, result);
    }

    @Post("logout")
    @HttpCode(204)
    async logout(
        @Req() request: RequestWithCookies,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        await this.authService.logout(request.cookies?.refreshToken ?? "");
        response.clearCookie("refreshToken", refreshCookieOptions);
    }

    private withRefreshCookie(
        response: Response, 
        result: AuthResult,
    ): Omit<AuthResult, "refreshToken"> {
        const { refreshToken, ...publicResult } = result;
        response.cookie(
            "refreshToken", 
            result.refreshToken, 
            refreshCookieOptions
        );
        return publicResult;
    }

}