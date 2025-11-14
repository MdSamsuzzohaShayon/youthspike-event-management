import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChangeServerReceiverInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';

export class ChangeServerReceiverManually {
  constructor(private readonly gatewayService: GatewayService, private readonly scoreKeeperHelper: ScoreKeeperHelper) {}

  async handle(@ConnectedSocket() client: Socket, @MessageBody() body: ChangeServerReceiverInput) {
    try {
      const { server, receiver, servingPartner, receivingPartner } = body;

      // ✅ Step 1: Validate that all are strings
      const players = { server, receiver, servingPartner, receivingPartner };
      for (const [key, value] of Object.entries(players)) {
        if (typeof value !== 'string' || !value.trim()) {
          throw new Error(`Invalid value for ${key}. It must be a non-empty string.`);
        }
      }

      // ✅ Step 2: Ensure all are unique
      const uniqueValues = new Set(Object.values(players));
      if (uniqueValues.size !== Object.values(players).length) {
        throw new Error('Server, receiver, serving partner, and receiving partner must be unique.');
      }

      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room);

      this.scoreKeeperHelper.rotateServerReceiverManually(net, body);

      // Check who is new server and new receiver
      this.scoreKeeperHelper.saveNetAction(body.net, body.room, net);

      await this.scoreKeeperHelper.publishRoom(body.room, 'change-server-receiver-manullay', net);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
