import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ServiceConfigModule } from '@app/config/service-config.module';
import { PrismaModule } from './database/prisma.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtTokenService } from './auth/jwt.service';
import { PrismaService } from './database/prisma.service';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';
import { PasswordService } from './auth/password.service';
import { AccessTokenGuard } from './auth/access-token.guard';
import { validateIdentityEnv } from './config/identity-env';

@Module({
  imports: [
    ServiceConfigModule.forService('identity-service', validateIdentityEnv),
    PrismaModule,
    JwtModule.register({}),
  ],
  controllers: [
    AuthController,
    ProfileController,
  ],
  providers: [
    AuthService,
    JwtTokenService,
    ProfileService,
    PasswordService,
    AccessTokenGuard,
  ],
})
export class IdentityServiceModule { }
