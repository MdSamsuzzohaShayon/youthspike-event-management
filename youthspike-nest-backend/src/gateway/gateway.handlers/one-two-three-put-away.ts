import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, ServerReceiverOnNet, OneTwoThreePutAwayInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { initPlayerStat } from 'src/util/helper';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { ClientHelper } from '../gateway.helpers/client.helper';
import { ValidationHelper } from '../gateway.helpers/validation.helper';

export class OneTwoThreePutAwayHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly clientHelper: ClientHelper,
    private readonly validationHelper: ValidationHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() oneTwoThreePutAwayInput: OneTwoThreePutAwayInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      // Receiving team Scores
      // Switch the position with partner

      const NET_CACHE_KEY = `sr:${oneTwoThreePutAwayInput.net}:${oneTwoThreePutAwayInput.room}`;

      // player service opportunity increase
      const netCacheData = await this.gatewayRedisService.getAction(NET_CACHE_KEY);
      if (!netCacheData) {
        throw new Error(`Net data not found, try setting players on the net again: ${oneTwoThreePutAwayInput}`);
      }

      const actionData: ServerReceiverOnNet = { ...netCacheData };

      const { netService } = this.gatewayService.getServices();

      const netExist = await netService.findById(oneTwoThreePutAwayInput.net);

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

      // Receiver
      const RECEIVER_PLAYER_CACHE = `player:${actionData.server}`;
      let receiverStats = await this.gatewayRedisService.getAction(RECEIVER_PLAYER_CACHE);
      if (!receiverStats) {
        receiverStats = initPlayerStat(actionData.match, actionData.server);
      }
      const receiverStatsData: PlayerStats = { ...receiverStats };
      receiverStatsData.serveOpportunity = receiverStatsData.serveOpportunity + 1;
      receiverStatsData.serveCompletionCount = receiverStatsData.serveCompletionCount + 1;
      receiverStatsData.defensiveOpportunity = receiverStatsData.defensiveOpportunity + 1;
      await this.gatewayRedisService.setAction(RECEIVER_PLAYER_CACHE, receiverStatsData);

      // Receiver partner / setting
      const RECEIVER_PARTNER_PLAYER_CACHE = `player:${actionData.server}`;
      let receiverPartnerStats = await this.gatewayRedisService.getAction(RECEIVER_PARTNER_PLAYER_CACHE);
      if (!receiverPartnerStats) {
        receiverPartnerStats = initPlayerStat(actionData.match, actionData.server);
      }
      const receiverPartnerStatsData: PlayerStats = { ...receiverPartnerStats };
      receiverPartnerStatsData.receiverOpportunity = receiverPartnerStatsData.receiverOpportunity + 1;
      receiverPartnerStatsData.receivedCount = receiverPartnerStatsData.receivedCount + 1;
      receiverPartnerStatsData.settingOpportunity = receiverPartnerStatsData.settingOpportunity + 1;
      receiverPartnerStatsData.settingCompletion = receiverPartnerStatsData.settingCompletion + 1;
      receiverPartnerStatsData.hittingOpportunity = receiverPartnerStatsData.hittingOpportunity + 1;
      receiverPartnerStatsData.cleanHits = receiverPartnerStatsData.cleanHits + 1;
      await this.gatewayRedisService.setAction(RECEIVER_PARTNER_PLAYER_CACHE, receiverPartnerStatsData);

      // Server partner
      const SERVER_PARTNER_PLAYER_CACHE = `player:${actionData.server}`;
      let serverPartnerStats = await this.gatewayRedisService.getAction(SERVER_PARTNER_PLAYER_CACHE);
      if (!serverPartnerStats) {
        serverPartnerStats = initPlayerStat(actionData.match, actionData.server);
      }
      const serverPartnerStatsData: PlayerStats = { ...serverPartnerStats };
      serverPartnerStatsData.defensiveOpportunity = serverPartnerStatsData.defensiveOpportunity + 1;
      await this.gatewayRedisService.setAction(SERVER_PARTNER_PLAYER_CACHE, serverPartnerStatsData);

      // Score update in the net
      const receiverInTeamA = teamA.has(actionData.receiver);
      const receiverInTeamB = teamB.has(actionData.receiver);

      if (!receiverInTeamA && !receiverInTeamB) {
        throw new Error(`Server is not part of the net. Input: ${oneTwoThreePutAwayInput}`);
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
        oneTwoThreePutAwayInput.room,
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
