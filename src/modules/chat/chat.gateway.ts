import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Inject, Logger } from '@nestjs/common';

import {
  ON_USER_UNAVAILABLE,
  ON_VIDEO_CALL,
  ON_VIDEO_CALL_ACCEPT,
  ON_VIDEO_CALL_ACCEPTED,
  ON_VIDEO_CALL_HANG_UP,
  ON_VIDEO_CALL_INIT,
  ON_VIDEO_CALL_REJECTED,
  REQUEST_ALL_CONVERSATIONS,
  REQUEST_ALL_MESSAGES,
  REQUEST_DELETE_CONVERSATION,
  REQUEST_DELETE_MESSAGE,
  REQUEST_SEND_MESSAGE,
  REQUEST_STOP_TYPING_MESSAGE,
  REQUEST_TYPING_MESSAGE,
  REQUEST_UPDATE_MESSAGE,
  SEND_ALL_CONVERSATIONS,
  SEND_ALL_MESSAGES,
  SEND_DELETE_CONVERSATION,
  SEND_DELETE_MESSAGE,
  SEND_MESSAGE,
  SEND_STOP_TYPING_MESSAGE,
  SEND_TYPING_MESSAGE,
  SEND_UPDATE_MESSAGE,
  VIDEO_CALL_HANG_UP,
} from './utils/socketType';
import { GetMessagesDTO } from '../message/dtos/get-messages.dto';
import { IAuthSocket } from './interfaces/auth-socket.interface';
import { ChatSessionManager } from './chat.session';
import { MessageDeleteDTO } from '../message/dtos/message-delete.dto';
import { MessageService } from '../message/message.service';
import { ConversationService } from '../conversation/conversation.service';
import { ParticipantService } from '../participant/participant.service';
import { UpdateMessagePayload } from './payloads/update-message.payload';
import { DeleteConversationPayload } from './payloads/delete-conversation.payload';
import { SendMessagePayload } from './payloads/send-message.payload';
import { TypingMessagePayload } from './payloads/typing-message.payload';
import { VideoCallPayload } from './payloads/video-call.payload';
import { VideoCallAcceptedPayload } from './payloads/video-call-accepted-payload';
import { VideoCallRejectedPayload } from './payloads/video-call-rejected.payload';
import { VideoCallHangUpPayload } from './payloads/video-call-hang-up.payload';

@WebSocketGateway(3002, {
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(ChatSessionManager.name)
    private readonly chatSessionManager: ChatSessionManager,
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
    private readonly participantService: ParticipantService,
  ) {}

  @WebSocketServer()
  server: Server;
  private readonly logger: Logger = new Logger(ChatGateway.name);

  handleConnection(client: IAuthSocket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    this.chatSessionManager.setUserSocket(client.user._id, client);
  }

  handleDisconnect(client: IAuthSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.chatSessionManager.removeUserSocket(client.user._id);
  }

  @SubscribeMessage(REQUEST_ALL_CONVERSATIONS)
  async requestAllConversations(@ConnectedSocket() socket: IAuthSocket) {
    // conversation for user (exclude conversation deleted)
    const conversationsResPromise = this.conversationService.getByUserId({
      userId: socket.user._id,
    });
    // conversation for socket on event (include conversation deleted)
    const conversationsSocketPromise = this.conversationService.getByUserIdIncludeConversationDeleted(
      {
        userId: socket.user._id,
      },
    );

    const [conversationsRes, conversationsSocket] = await Promise.all([
      conversationsResPromise,
      conversationsSocketPromise,
    ]);

    conversationsSocket.forEach((conversation) => {
      socket.join(conversation._id.toString());
    });
    socket.emit(SEND_ALL_CONVERSATIONS, { conversations: conversationsRes });
  }

  @SubscribeMessage(REQUEST_DELETE_CONVERSATION)
  async deleteConversation(
    @ConnectedSocket() socket: IAuthSocket,
    @MessageBody() deleteConversationPayload: DeleteConversationPayload,
  ) {
    const { conversationId } = deleteConversationPayload;

    await this.participantService.leftConversation({
      conversationId,
      userId: socket.user._id,
    });
    const conversations = await this.conversationService.getByUserId({
      userId: socket.user._id,
    });

    socket.emit(SEND_DELETE_CONVERSATION, { conversations });
  }

  @SubscribeMessage(REQUEST_ALL_MESSAGES)
  async requestAllMessages(
    @ConnectedSocket() socket: IAuthSocket,
    @MessageBody() getMessageDTO: GetMessagesDTO,
  ) {
    const { conversationId } = getMessageDTO;

    const conversationConversation = this.conversationService.getById(
      conversationId,
    );
    const participantsPromise = this.participantService.getByConversationId(
      conversationId,
    );
    const messagesPromise = this.messageService.getMessagesByConversationIdAndUserId(
      conversationId,
      socket.user._id,
    );

    const [conversation, participants, messages] = await Promise.all([
      conversationConversation,
      participantsPromise,
      messagesPromise,
    ]);

    socket.emit(SEND_ALL_MESSAGES, {
      conversation,
      messages,
      receiverParticipant: participants.find(
        (participant) =>
          participant.user._id.toString() !== socket.user._id.toString(),
      ),
      senderParticipant: participants.find(
        (participant) =>
          participant.user._id.toString() === socket.user._id.toString(),
      ),
    });
  }

  @SubscribeMessage(REQUEST_TYPING_MESSAGE)
  typingMessage(
    @ConnectedSocket() socket: IAuthSocket,
    @MessageBody() typingMessagePayload: TypingMessagePayload,
  ) {
    const { conversationId } = typingMessagePayload;

    socket.to(conversationId).emit(SEND_TYPING_MESSAGE, { conversationId });
  }

  @SubscribeMessage(REQUEST_STOP_TYPING_MESSAGE)
  stopTypingMessage(
    @ConnectedSocket() socket: IAuthSocket,
    @MessageBody() typingMessageDTO: TypingMessagePayload,
  ) {
    const { conversationId } = typingMessageDTO;
    socket
      .to(conversationId)
      .emit(SEND_STOP_TYPING_MESSAGE, { conversationId });
  }

  @SubscribeMessage(REQUEST_SEND_MESSAGE)
  async sendMessage(
    @ConnectedSocket() socket: IAuthSocket,
    @MessageBody() sendMessagePayload: SendMessagePayload,
  ) {
    const {
      replyTo,
      content,
      senderParticipantId,
      conversationId,
      attachments,
    } = sendMessagePayload;

    if (!attachments && !content?.trim())
      throw new WsException("Message can't be empty");

    const {
      newMessage,
      conversationUpdated,
    } = await this.messageService.create({
      conversationId,
      content,
      replyTo,
      senderParticipantId,
      attachments,
    });

    this.server.in(conversationId).emit(SEND_MESSAGE, {
      message: newMessage,
      conversationUpdated,
    });
  }

  @SubscribeMessage(REQUEST_UPDATE_MESSAGE)
  async updateMessage(
    @MessageBody() updateMessagePayload: UpdateMessagePayload,
  ) {
    const { messageId, conversationId, content } = updateMessagePayload;

    const messageUpdatedPromise = this.messageService.updateMessage({
      messageId,
      content,
    });
    const conversationPromise = this.conversationService.getById(
      conversationId,
    );
    const [messageUpdated, conversation] = await Promise.all([
      messageUpdatedPromise,
      conversationPromise,
    ]);
    const isLastMessageChange =
      conversation.lastMessage._id.toString() === messageId;
    let conversationUpdated;
    if (isLastMessageChange) {
      conversationUpdated = await this.conversationService.updateLastMessage({
        conversationId,
        lastMessage: messageUpdated,
      });
    }

    this.server.in(conversationId).emit(SEND_UPDATE_MESSAGE, {
      message: messageUpdated,
      conversationUpdated,
    });
  }

  @SubscribeMessage(REQUEST_DELETE_MESSAGE)
  async deleteMessage(
    @ConnectedSocket() socket: IAuthSocket,
    @MessageBody() messageDeleteDTO: MessageDeleteDTO,
  ) {
    const { receiverId, messageId, conversation } = messageDeleteDTO;

    const sender = this.chatSessionManager.getUserSocket(socket.user._id);
    const receiver = this.chatSessionManager.getUserSocket(receiverId);

    await this.messageService.deleteMessage(messageId);
    const messages = await this.messageService.getMessagesByConversationIdAndUserId(
      conversation._id,
      socket.user._id,
    );

    let conversationUpdated;
    if (
      messages?.length > 0 &&
      conversation.lastMessage._id.toString() === messageId
    ) {
      conversationUpdated = await this.conversationService.updateLastMessage({
        conversationId: conversation._id,
        lastMessage: messages[0],
      });
    }

    sender &&
      sender.emit(SEND_DELETE_MESSAGE, { messages, conversationUpdated });
    receiver &&
      receiver.emit(SEND_DELETE_MESSAGE, { messages, conversationUpdated });
  }

  @SubscribeMessage(ON_VIDEO_CALL_INIT)
  handleVideoCall(
    @ConnectedSocket() socket: IAuthSocket,
    @MessageBody() payload: VideoCallPayload,
  ) {
    const { receiverId, conversationId } = payload;

    const caller = socket.user;
    const receiverSocket = this.chatSessionManager.getUserSocket(receiverId);

    if (receiverSocket) socket.emit(ON_USER_UNAVAILABLE);
    receiverSocket.emit(ON_VIDEO_CALL, { conversationId, receiverId, caller });
  }

  @SubscribeMessage(ON_VIDEO_CALL_ACCEPTED)
  async handleVideoCallAccepted(
    @ConnectedSocket() socket: IAuthSocket,
    @MessageBody() payload: VideoCallAcceptedPayload,
  ) {
    const { caller } = payload;

    const conversation = await this.conversationService.isCreated({
      receiverId: caller._id,
      senderId: socket.user._id,
    });
    if (!conversation) throw new WsException('Conversation not found');

    const callerSocket = this.chatSessionManager.getUserSocket(caller._id);
    if (callerSocket) {
      const _payload = { acceptor: socket.user, caller };
      callerSocket.emit(ON_VIDEO_CALL_ACCEPT, _payload);
      socket.emit(ON_VIDEO_CALL_ACCEPT, _payload);
    }
  }

  @SubscribeMessage(ON_VIDEO_CALL_REJECTED)
  async handleVideoCallRejected(
    @ConnectedSocket() socket: IAuthSocket,
    @MessageBody() payload: VideoCallRejectedPayload,
  ) {
    const { caller } = payload;

    const callerSocket = this.chatSessionManager.getUserSocket(caller._id);
    const receiverSocket = this.chatSessionManager.getUserSocket(
      socket.user._id,
    );

    callerSocket &&
      callerSocket.emit(ON_VIDEO_CALL_REJECTED, { receiver: socket.user });
    receiverSocket && receiverSocket.emit(ON_VIDEO_CALL_REJECTED);
  }

  @SubscribeMessage(VIDEO_CALL_HANG_UP)
  handleVideoCallHangUp(
    @ConnectedSocket() socket: IAuthSocket,
    @MessageBody() payload: VideoCallHangUpPayload,
  ) {
    const { receiver, caller } = payload;

    if (socket?.user?.id === caller?.id) {
      const receiverSocket = this.chatSessionManager.getUserSocket(receiver.id);
      socket.emit(ON_VIDEO_CALL_HANG_UP);
      receiverSocket && receiverSocket?.emit(ON_VIDEO_CALL_HANG_UP);
      return;
    }

    socket.emit(ON_VIDEO_CALL_HANG_UP);
    const callerSocket = this.chatSessionManager.getUserSocket(caller.id);
    callerSocket && callerSocket.emit(ON_VIDEO_CALL_HANG_UP);
  }
}
