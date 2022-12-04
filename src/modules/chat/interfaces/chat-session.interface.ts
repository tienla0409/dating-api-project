import { Types } from 'mongoose';

import { IAuthSocket } from './auth-socket.interface';

export interface IChatSession {
  getUserSocket(id: string | Types.ObjectId);
  setUserSocket(id: string | Types.ObjectId, socket: IAuthSocket);
  removeUserSocket(id: string | Types.ObjectId);
  getSockets();
}
