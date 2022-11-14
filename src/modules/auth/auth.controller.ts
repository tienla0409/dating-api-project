import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { User } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthCredentialsDTO } from './dtos/auth-credetials.dto';
import { JwtAuthenticationGuard } from './guards/jwt-authentication.guard';
import JwtRefreshTokenGuard from './guards/jwt-refresh-token.guard';
import { LocalAuthenticationGuard } from './guards/local-authentication.guard';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
  AUTH_ROUTE,
  LOGOUT_ROUTE,
  REFRESH_ROUTE,
  SIGN_IN_ROUTE,
  SIGN_UP_ROUTE,
} from './utils/routes';

@Controller(AUTH_ROUTE)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post(SIGN_UP_ROUTE)
  async signUp(@Body() authCredentialsDto: AuthCredentialsDTO) {
    try {
      return await this.authService.signUp(authCredentialsDto);
    } catch (err) {
      if (err.code === 11000) {
        throw new HttpException(
          'Username already exists.',
          HttpStatus.CONFLICT,
        );
      }
      throw new InternalServerErrorException();
    }
  }

  @Post(SIGN_IN_ROUTE)
  @UseGuards(LocalAuthenticationGuard)
  @HttpCode(HttpStatus.OK)
  async signIn(@Req() req: Request, @Res() res: Response) {
    try {
      const { user } = req;
      const jwtPayload: JwtPayload = { userId: (user as User)._id };
      const accessTokenCookie =
        this.authService.getCookieWithJwtAccessToken(jwtPayload);
      const { token, cookie } =
        this.authService.getCookieWithJwtRefreshToken(jwtPayload);

      await this.usersService.updateFrefreshToken(token, jwtPayload.userId);

      res.setHeader('Set-Cookie', [accessTokenCookie, cookie]);
      res.json({ data: user });
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  @Get(REFRESH_ROUTE)
  @UseGuards(JwtRefreshTokenGuard)
  refresh(@Req() req, @Res() res) {
    const { user } = req;
    const accessTokenCookie = this.authService.getCookieWithJwtAccessToken({
      userId: user.id,
    });

    res.setHeader('Set-Cookie', accessTokenCookie);
    res.json({ data: user });
  }

  @Post(LOGOUT_ROUTE)
  @UseGuards(JwtAuthenticationGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response) {
    const { user } = req;
    await this.usersService.removeRefreshToken((user as User)._id);
    res.setHeader('Set-Cookie', this.authService.getCookieForLogout());
    res.json({});
  }
}
