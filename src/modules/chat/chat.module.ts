import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { Message, MessageSchema } from './schemas/message.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';
import { Participant, ParticipantSchema } from './schemas/participant.schema';
import { ChatSessionManager } from './chat.session';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Participant.name, schema: ParticipantSchema },
    ]),
  ],
  providers: [
    ChatService,
    ChatGateway,
    {
      provide: ChatSessionManager.name,
      useClass: ChatSessionManager,
    },
  ],
})
export class ChatModule {}
