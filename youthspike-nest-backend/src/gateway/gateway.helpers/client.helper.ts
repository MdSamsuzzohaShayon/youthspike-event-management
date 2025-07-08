import { UserRole } from 'src/user/user.schema';
import { GeneralClient } from '../gateway.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientHelper {
  updateClientData(
    clientList: Map<string, GeneralClient>,
    clientId: string,
    data: {
      userId?: string;
      matchId?: string;
      userRole?: UserRole;
    },
  ) {
    const existing = clientList.get(clientId) || {
      _id: null,
      matches: [],
      userRole: UserRole.public,
    };

    const updated: GeneralClient = {
      _id: data.userId ?? existing._id,
      matches: data.matchId ? [...new Set([...existing.matches, data.matchId])] : existing.matches,
      userRole: data.userRole ?? existing.userRole,
      lastActive: new Date(),
    };

    clientList.set(clientId, updated);
  }
}