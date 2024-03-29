import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { BaseModule } from './modules/base/base.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import envConfigs from './configs/env.config';
import { MongoConfig } from './configs/mongodb.config';
import { MailModule } from './modules/mail/mail.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { MessageModule } from './modules/message/message.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { ParticipantModule } from './modules/participant/participant.module';
import { GenderModule } from './modules/gender/gender.module';
import { InterestedInGenderModule } from './modules/interested-in-gender/interested-in-gender.module';
import { UserGenderModule } from './modules/user-gender/user-gender.module';
import { MessageAttachmentModule } from './modules/message-attachment/message-attachment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { RoleModule } from './modules/role/role.module';
import { BlockUserModule } from './modules/block-user/block-user.module';
import { UserPreferenceModule } from './modules/user-preference/user-preference.module';
import { RelationshipTypeModule } from './modules/relationship-type/relationship-type.module';
import { PassionModule } from './modules/passion/passion.module';
import { UserMatchModule } from './modules/user-match/user-match.module';
import { UserDiscardModule } from './modules/user-discard/user-discard.module';
import { UserLikeModule } from './modules/user-like/user-like.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PremiumPackageModule } from './modules/premium-package/premium-package.module';
import { UserPremiumPackageModule } from './modules/user-premium-package/user-premium-package.module';
import { NotificationObjectModule } from './modules/notification-object/notification-object.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development'],
      load: [envConfigs],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MongoConfig,
    }),
    EventEmitterModule.forRoot(),
    BaseModule,
    AuthModule,
    UsersModule,
    MailModule,
    GatewayModule,
    CloudinaryModule,
    MessageModule,
    ConversationModule,
    ParticipantModule,
    GenderModule,
    InterestedInGenderModule,
    UserGenderModule,
    MessageAttachmentModule,
    RoleModule,
    BlockUserModule,
    UserPreferenceModule,
    RelationshipTypeModule,
    PassionModule,
    UserMatchModule,
    UserDiscardModule,
    UserLikeModule,
    PaymentModule,
    PremiumPackageModule,
    UserPremiumPackageModule,
    NotificationModule,
    NotificationObjectModule,
  ],
  controllers: [],
})
export class AppModule {}
