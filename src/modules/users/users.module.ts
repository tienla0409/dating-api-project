import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserPhoto, UserPhotoSchema } from './schemas/user-photo.schema';
import { Gender, GenderSchema } from '../gender/gender.schema';
import { InterestedInGenderModule } from '../interested-in-gender/interested-in-gender.module';
import { UserGenderModule } from '../user-gender/user-gender.module';
import { RoleModule } from '../role/role.module';
import { RelationshipTypeModule } from '../relationship-type/relationship-type.module';
import { UserMatchModule } from '../user-match/user-match.module';
import { UserLikeModule } from '../user-like/user-like.module';
import { UserDiscardModule } from '../user-discard/user-discard.module';
import { PaymentModule } from '../payment/payment.module';
import { UsersAdminController } from './users.admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserPhoto.name, schema: UserPhotoSchema },
      { name: Gender.name, schema: GenderSchema },
    ]),
    InterestedInGenderModule,
    UserGenderModule,
    RoleModule,
    RelationshipTypeModule,
    UserMatchModule,
    UserLikeModule,
    UserDiscardModule,
    PaymentModule,
  ],
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
