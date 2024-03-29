import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { MailModule } from 'src/modules/mail/mail.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtRefreshTokenStrategy } from './strategies/jwt-refresh-token.strategy';
import { MailService } from '../mail/mail.service';
import { AuthAdminController } from './auth.admin.controller';
import { UserPreferenceModule } from '../user-preference/user-preference.module';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    MailModule,
    UserPreferenceModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.accessSecret'),
        signOptions: {
          expiresIn: configService.get('jwt.accessExpiresIn'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    MailService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshTokenStrategy,
  ],
  controllers: [AuthController, AuthAdminController],
  exports: [AuthService],
})
export class AuthModule {}
