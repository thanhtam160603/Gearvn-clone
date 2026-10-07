import { Controller, Get, Patch, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IdentityProxyService } from './identity-proxy.service';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('users')
export class ProfileGatewayController {
  constructor(private readonly identity: IdentityProxyService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy hồ sơ người dùng hiện tại' })
  getCurrentUser(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.identity.forward('/users/me', req, res);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật hồ sơ người dùng hiện tại' })
  @ApiBody({ schema: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      phone: { type: 'string' },
      birthDate: { type: 'string', format: 'date' },
    },
  } })
  updateProfile(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.identity.forward('/users/me', req, res);
  }
}
