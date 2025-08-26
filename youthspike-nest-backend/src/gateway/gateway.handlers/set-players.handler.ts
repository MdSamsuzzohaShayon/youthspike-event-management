// Score keeping -> set-server-receiver-from-client
import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, SetPlayersInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ServerReceiverOnNet } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { ValidationHelper } from '../gateway.helpers/validation.helper';

export class SetPlayersHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly validationHelper: ValidationHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SetPlayersInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    const inputStr = JSON.stringify(body);
    try {
      const prevRoom = roomsLocal.get(body.room);
      if (!prevRoom) throw new Error('Room not found, Incorrect room ID!');

      // For setting and getting
      const SR_CACHE_KEY = `sr:${body.net}:${body.room}`; // each net will have a unique key

      const { playerService, matchService, netService, jwtService } = this.gatewayService.getServices();

      const [serverExist, receiverExist, matchExist, netExist] = await Promise.all([
        playerService.findById(body.server),
        playerService.findById(body.receiver),
        matchService.findById(body.match),
        netService.findById(body.net),
      ]);

      if (!serverExist || !receiverExist) {
        throw new Error(`Server or Receiver not found! Input: ${inputStr}`);
      }

      if (!matchExist) {
        throw new Error(`Match not found! Input: ${inputStr}`);
      }

      // ✅ Check if body.accessCode is a valid JWT OR matches stored accessCode
      this.validationHelper.authCheck(body?.accessCode || null, jwtService, matchExist?.accessCode || null);

      const requiredPlayers = [
        netExist?.teamAPlayerA,
        netExist?.teamAPlayerB,
        netExist?.teamBPlayerA,
        netExist?.teamBPlayerB,
      ];

      if (requiredPlayers.some((p) => !p)) {
        throw new Error(`Incomplete net! Ensure all players are submitted. Input: ${inputStr}`);
      }

      const teamA = new Set([netExist.teamAPlayerA, netExist.teamAPlayerB]);
      const teamB = new Set([netExist.teamBPlayerA, netExist.teamBPlayerB]);

      const serverInTeamA = teamA.has(body.server);
      const serverInTeamB = teamB.has(body.server);

      if (!serverInTeamA && !serverInTeamB) {
        throw new Error(`Server is not part of the net. Input: ${inputStr}`);
      }

      const isValidReceiver =
        (serverInTeamA && teamB.has(body.receiver)) || (serverInTeamB && teamA.has(body.receiver));

      if (!isValidReceiver) {
        throw new Error(`Receiver is not on the opposite team. Input: ${inputStr}`);
      }

      const [server, servingPartner] = serverInTeamA
        ? [body.server, [...teamA].find((p) => p !== body.server)!]
        : [body.server, [...teamB].find((p) => p !== body.server)!];

      const [receiver, receivingPartner] = serverInTeamA
        ? [body.receiver, [...teamB].find((p) => p !== body.receiver)!]
        : [body.receiver, [...teamA].find((p) => p !== body.receiver)!];

      const actionData: ServerReceiverOnNet = {
        mutate: 1,
        play: 1,
        server,
        serverId: server,
        servingPartner,
        receiver,
        receivingPartner,
        room: prevRoom._id,
        match: body.match,
        net: body.net,
        round: body.round,
        serverPositionPair: body.serverPositionPair,
        teamAScore: 0,
        teamBScore: 0,
      };

      // Setting initially
      await this.gatewayRedisService.setAction(SR_CACHE_KEY, actionData);

      await this.gatewayRedisService.publishToRoom(
        body.room,
        'set-players-from-server',
        actionData,
        // client.id,
      );
    } catch (error) {
      await this.gatewayRedisService.publishToSocket(
        client.id,
        'error-from-server',
        error?.message || 'Internal error occured',
      );
    }
  }
}
