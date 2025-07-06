import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, ServerReceiverOnNet, RallyConversionInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { initPlayerStat } from 'src/util/helper';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { ClientHelper } from '../gateway.helpers/client.helper';
import { ValidationHelper } from '../gateway.helpers/validation.helper';

export class RallyConversionHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly clientHelper: ClientHelper,
    private readonly validationHelper: ValidationHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() rallyConversionInput: RallyConversionInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      // Receiving team Scores
      // Switch the position with partner
      const NET_CACHE_KEY = `sr:${rallyConversionInput.net}:${rallyConversionInput.room}`;

      // player service opportunity increase
      const netCacheData = await this.gatewayRedisService.getAction(NET_CACHE_KEY);
      if (!netCacheData) {
        throw new Error(`Net data not found, try setting players on the net again: ${rallyConversionInput}`);
      }

      const actionData: ServerReceiverOnNet = { ...netCacheData };

      const { netService } = this.gatewayService.getServices();

      const netExist = await netService.findById(rallyConversionInput.net);

      const teamA = new Set([netExist.teamAPlayerA, netExist.teamAPlayerB]);
      const teamB = new Set([netExist.teamBPlayerA, netExist.teamBPlayerB]);

      // player point calculate
      // Server: +1 server opportunity, +1 serve conpletion count, +1 serving ace, +1 break
      const SERVER_PLAYER_CACHE = `player:${actionData.server}`;
      let serverStats = await this.gatewayRedisService.getAction(SERVER_PLAYER_CACHE);
      if (!serverStats) {
        serverStats = initPlayerStat(actionData.match, actionData.server);
      }
      const serverStatsData: PlayerStats = { ...serverStats };
      serverStatsData.serveOpportunity = serverStatsData.serveOpportunity + 1;
      serverStatsData.serveCompletionCount = serverStatsData.serveCompletionCount + 1;
      serverStatsData.defensiveOpportunity = serverStatsData.defensiveOpportunity + 1;
      await this.gatewayRedisService.setAction(SERVER_PLAYER_CACHE, serverStatsData);

      // Score update in the net
      const receiverInTeamA = teamA.has(actionData.receiver);
      const receiverInTeamB = teamB.has(actionData.receiver);

      if (!receiverInTeamA && !receiverInTeamB) {
        throw new Error(`Server is not part of the net. Input: ${rallyConversionInput}`);
      }

      if (receiverInTeamA) {
        actionData.teamAScore = actionData.teamAScore + 1;
      }
      if (receiverInTeamB) {
        actionData.teamBScore = actionData.teamBScore + 1;
      }

      // Swep receiver with receiving partner
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
        rallyConversionInput.room,
        'one-two-three-put-away-from-server',
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
