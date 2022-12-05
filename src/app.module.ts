import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { BaseModule } from './modules/base/base.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import envConfigs from './configs/env.config';
import { MongoConfig } from './configs/mongodb.config';
import { MailModule } from './modules/mail/mail.module';
import { ChatModule } from './modules/chat/chat.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { MessageModule } from './modules/message/message.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { ParticipantModule } from './modules/participant/participant.module';

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
    BaseModule,
    AuthModule,
    UsersModule,
    MailModule,
    ChatModule,
    CloudinaryModule,
    MessageModule,
    ConversationModule,
    ParticipantModule,
  ],
  controllers: [],
})
export class AppModule {}
