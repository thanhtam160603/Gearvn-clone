import { Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBody, ApiCookieAuth, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IdentityProxyService } from './identity-proxy.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthGatewayController {
  constructor(private readonly identity: IdentityProxyService) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiBody({ schema: {
    type: 'object', required: ['email', 'password'],
    properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } },
  } })
  login(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.identity.forward('/auth/login', req, res);
  }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản' })
  @ApiBody({ schema: {
    type: 'object', required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string' }, email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
    },
  } })
  register(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.identity.forward('/auth/register', req, res);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Đổi refresh cookie lấy access token mới' })
  @ApiCookieAuth('refreshToken')
  refresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.identity.forward('/auth/refresh', req, res);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất và xóa refresh cookie' })
  @ApiCookieAuth('refreshToken')
  @ApiNoContentResponse({ description: 'Refresh session đã được thu hồi' })
  logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.identity.forward('/auth/logout', req, res);
  }
}
