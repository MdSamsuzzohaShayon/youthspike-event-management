import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SetServerReceiverInput, ServerReceiverOnNet, RoomLocal } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';

export class ServerReceiverHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() serverReceiverInput: SetServerReceiverInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      const prevRoom = roomsLocal.get(serverReceiverInput.room);
      if (!prevRoom) throw new Error('Room not found, Incorrect room ID!');

      const { playerService, matchService, netService } = this.gatewayService.getServices();
      const [serverExist, receiverExist, matchExist, netExist] = await Promise.all([
        playerService.findById(serverReceiverInput.server),
        playerService.findById(serverReceiverInput.receiver),
        matchService.findById(serverReceiverInput.match),
        netService.findById(serverReceiverInput.net),
      ]);

      if (!serverExist || !receiverExist) {
        throw new Error(
          `Server or Receiver on the net not found! Input detail: ${JSON.stringify(serverReceiverInput)}`,
        );
      }

      if (!matchExist) throw new Error(`Match not found! Input detail: ${JSON.stringify(serverReceiverInput)}`);

      if (serverReceiverInput.accessCode !== matchExist.accessCode) {
        throw new Error(
          `You do not have permission to do this, you can still try again by logout and logging in again and  put the access code for specific match! Input detail: ${JSON.stringify(
            serverReceiverInput,
          )}`,
        );
      }

      if (
        !netExist ||
        !netExist?.teamAPlayerA ||
        !netExist?.teamAPlayerB ||
        !netExist?.teamBPlayerA ||
        !netExist?.teamBPlayerB
      ) {
        throw new Error(
          `Incomplete net, try submitting all players of both teams in the specific net! Input detail: ${JSON.stringify(
            serverReceiverInput,
          )}`,
        );
      }

      let server = null,
        receiver = null,
        servingPartner = null,
        receivingPartner = null;
      let serverInTeamA = true;
      let found = false;
      if (
        serverReceiverInput.server === netExist.teamAPlayerA ||
        serverReceiverInput.server === netExist.teamAPlayerB
      ) {
        found = true;
      }

      if (
        serverReceiverInput.server === netExist.teamBPlayerA ||
        serverReceiverInput.server === netExist.teamBPlayerB
      ) {
        found = true;
        serverInTeamA = false;
      }

      if (!found) {
        throw new Error(
          `Server or receiver not in the specific net! Input detail: ${JSON.stringify(serverReceiverInput)}`,
        );
      }

      if (serverInTeamA) {
        if (serverReceiverInput.server === netExist.teamAPlayerA) {
          server = netExist.teamAPlayerA;
          servingPartner = netExist.teamAPlayerB;
        }
        if (serverReceiverInput.server === netExist.teamAPlayerB) {
          server = netExist.teamAPlayerB;
          servingPartner = netExist.teamAPlayerA;
        }

        if (serverReceiverInput.receiver === netExist.teamBPlayerA) {
          receiver = netExist.teamBPlayerA;
          receivingPartner = netExist.teamBPlayerB;
        }

        if (serverReceiverInput.receiver === netExist.teamBPlayerB) {
          receiver = netExist.teamBPlayerB;
          receivingPartner = netExist.teamBPlayerA;
        }
      } else {
        if (serverReceiverInput.server === netExist.teamBPlayerA) {
          server = netExist.teamBPlayerA;
          servingPartner = netExist.teamBPlayerB;
        }
        if (serverReceiverInput.server === netExist.teamBPlayerB) {
          server = netExist.teamBPlayerB;
          servingPartner = netExist.teamBPlayerA;
        }

        if (serverReceiverInput.receiver === netExist.teamAPlayerA) {
          receiver = netExist.teamAPlayerA;
          receivingPartner = netExist.teamAPlayerB;
        }

        if (serverReceiverInput.receiver === netExist.teamAPlayerB) {
          receiver = netExist.teamAPlayerB;
          receivingPartner = netExist.teamAPlayerA;
        }
      }

      const actionData: ServerReceiverOnNet = {
        mutate: 0,
        server,
        servingPartner,
        receiver,
        receivingPartner,
        room: prevRoom._id,
        match: serverReceiverInput.match,
        net: serverReceiverInput.net,
        round: serverReceiverInput.round,
      };

      await this.gatewayRedisService.publishToRoom(
        serverReceiverInput.room,
        'set-players-from-server',
        actionData,
        client.id,
      );
    } catch (error) {
      await this.gatewayRedisService.publishToRoom(
        serverReceiverInput.room,
        'error-from-server',
        error?.message || 'Internal error occured',
      );
    }
  }
}