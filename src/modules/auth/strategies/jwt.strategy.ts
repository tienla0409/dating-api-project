import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from 'src/modules/users/users.service';
import { IJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('jwt.accessSecret'),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          console.log('req.headers.authentication', req.headers.authentication);
          return req.headers.authentication as any;
        },
      ]),
    });
  }

  async validate(jwtPayload: IJwtPayload) {
    const { userId } = jwtPayload;
    const user = await this.usersService.getById(userId);
    if (!user) {
      throw new UnauthorizedException('Please check your login credetials');
    }
    return user;
  }
}
