import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, ServerReceiverOnNet, ServiceFaultInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { initPlayerStat } from 'src/util/helper';

export class ServiceFaultHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() serviceFaultInput: ServiceFaultInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      // Receiving team Scores

      const NET_CACHE_KEY = `sr:${serviceFaultInput.net}:${serviceFaultInput.room}`;

      // player service opportunity increase
      const netCacheData = await this.gatewayRedisService.getAction(NET_CACHE_KEY);
      if (!netCacheData) {
        throw new Error(`Net data not found, try setting players on the net again: ${serviceFaultInput}`);
      }

      const actionData: ServerReceiverOnNet = { ...netCacheData };

      const { netService, playerStatsService } = this.gatewayService.getServices();

      const [netExist] = await Promise.all([netService.findById(serviceFaultInput.net)]);

      const teamA = new Set([netExist.teamAPlayerA, netExist.teamAPlayerB]);
      const teamB = new Set([netExist.teamBPlayerA, netExist.teamBPlayerB]);

      // Add a point to server, cache it, will save on the server later
      const SERVER_PLAYER_CACHE = `player:${actionData.server}`;
      let serverStats = await this.gatewayRedisService.getAction(SERVER_PLAYER_CACHE);
      if (!serverStats) {
        serverStats = initPlayerStat(actionData.match, actionData.server);
      }
      const serverStatsData: PlayerStats = { ...serverStats };
      serverStatsData.serveOpportunity = serverStatsData.serveOpportunity + 1;
      await this.gatewayRedisService.setAction(SERVER_PLAYER_CACHE, serverStatsData);

      // Score update in the net
      const receiverInTeamA = teamA.has(actionData.receiver);
      const receiverInTeamB = teamB.has(actionData.receiver);

      if (!receiverInTeamA && !receiverInTeamB) {
        throw new Error(`Server is not part of the net. Input: ${serviceFaultInput}`);
      }

      if (receiverInTeamA) {
        actionData.teamAScore = actionData.teamAScore + 1;
      }
      if (receiverInTeamB) {
        actionData.teamBScore = actionData.teamBScore + 1;
      }

      // Swep server and receiver
      const tempServer = actionData.server;
      actionData.server = actionData.receiver;
      actionData.receiver = tempServer;
      const tempPartner = actionData.servingPartner;
      actionData.servingPartner = actionData.receivingPartner;
      actionData.receivingPartner = tempPartner;

      // Track number of update
      actionData.mutate += 1;
      await this.gatewayRedisService.setAction(NET_CACHE_KEY, actionData);

      // Response back
      await this.gatewayRedisService.publishToRoom(
        serviceFaultInput.room,
        'service-fault-from-server',
        actionData,
        // client.id,
      );
    } catch (error: any) {
      await this.gatewayRedisService.publishToSocket(
        client.id,
        'error-from-server',
        error?.message || 'Internal error occured',
      );
    }
  }
}
