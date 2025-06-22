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
    const inputStr = JSON.stringify(serverReceiverInput);
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
        throw new Error(`Server or Receiver not found! Input: ${inputStr}`);
      }

      if (!matchExist) {
        throw new Error(`Match not found! Input: ${inputStr}`);
      }

      if (serverReceiverInput.accessCode !== matchExist.accessCode) {
        throw new Error(`Access denied! Try logging in again and re-entering access code. Input: ${inputStr}`);
      }

      const requiredPlayers = [
        netExist?.teamAPlayerA,
        netExist?.teamAPlayerB,
        netExist?.teamBPlayerA,
        netExist?.teamBPlayerB,
      ];

      if (requiredPlayers.some(p => !p)) {
        throw new Error(`Incomplete net! Ensure all players are submitted. Input: ${inputStr}`);
      }

      const teamA = new Set([netExist.teamAPlayerA, netExist.teamAPlayerB]);
      const teamB = new Set([netExist.teamBPlayerA, netExist.teamBPlayerB]);

      const serverInTeamA = teamA.has(serverReceiverInput.server);
      const serverInTeamB = teamB.has(serverReceiverInput.server);

      if (!serverInTeamA && !serverInTeamB) {
        throw new Error(`Server is not part of the net. Input: ${inputStr}`);
      }

      const isValidReceiver =
        (serverInTeamA && teamB.has(serverReceiverInput.receiver)) ||
        (serverInTeamB && teamA.has(serverReceiverInput.receiver));

      if (!isValidReceiver) {
        throw new Error(`Receiver is not on the opposite team. Input: ${inputStr}`);
      }

      const [server, servingPartner] = serverInTeamA
        ? [serverReceiverInput.server, [...teamA].find(p => p !== serverReceiverInput.server)!]
        : [serverReceiverInput.server, [...teamB].find(p => p !== serverReceiverInput.server)!];

      const [receiver, receivingPartner] = serverInTeamA
        ? [serverReceiverInput.receiver, [...teamB].find(p => p !== serverReceiverInput.receiver)!]
        : [serverReceiverInput.receiver, [...teamA].find(p => p !== serverReceiverInput.receiver)!];

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
        error?.message || 'Internal error occurred',
      );
    }
  }
}
