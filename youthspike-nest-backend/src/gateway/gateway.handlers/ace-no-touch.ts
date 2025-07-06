import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, ServerReceiverOnNet, AceNoTouchInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { initPlayerStat } from 'src/util/helper';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { ClientHelper } from '../gateway.helpers/client.helper';
import { ValidationHelper } from '../gateway.helpers/validation.helper';

export class AceNoTouchHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly clientHelper: ClientHelper,
    private readonly validationHelper: ValidationHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() aceNoTouchInput: AceNoTouchInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      // Serving team Scores
      // Switch the position with partner

      const NET_CACHE_KEY = `sr:${aceNoTouchInput.net}:${aceNoTouchInput.room}`;

      // player service opportunity increase
      const netCacheData = await this.gatewayRedisService.getAction(NET_CACHE_KEY);
      if (!netCacheData) {
        throw new Error(`Net data not found, try setting players on the net again: ${aceNoTouchInput}`);
      }

      const actionData: ServerReceiverOnNet = { ...netCacheData };

      const { netService } = this.gatewayService.getServices();

      const netExist = await netService.findById(aceNoTouchInput.net);

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
      serverStatsData.serveAce = serverStatsData.serveAce + 1;
      serverStatsData.break = serverStatsData.break + 1;
      await this.gatewayRedisService.setAction(SERVER_PLAYER_CACHE, serverStatsData);
      // Receiver: +1 receiver opportunity, +1 No touch aced count, +1 broken
      const RECEIVER_PLAYER_CACHE = `player:${actionData.receiver}`;
      let receiverStats = await this.gatewayRedisService.getAction(RECEIVER_PLAYER_CACHE);
      if (!receiverStats) {
        receiverStats = initPlayerStat(actionData.match, actionData.server);
      }
      const receiverStatsData: PlayerStats = { ...receiverStats };
      receiverStatsData.receiverOpportunity = receiverStatsData.receiverOpportunity + 1;
      receiverStatsData.noTouchAcedCount = receiverStatsData.noTouchAcedCount + 1;
      receiverStatsData.broken = receiverStatsData.broken + 1;
      await this.gatewayRedisService.setAction(RECEIVER_PLAYER_CACHE, receiverStatsData);

      // Score update in the net
      const serverInTeamA = teamA.has(actionData.server);
      const serverInTeamB = teamB.has(actionData.server);

      if (!serverInTeamA && !serverInTeamB) {
        throw new Error(`Server is not part of the net. Input: ${aceNoTouchInput}`);
      }

      if (serverInTeamA) {
        actionData.teamAScore = actionData.teamAScore + 1;
      }
      if (serverInTeamB) {
        actionData.teamBScore = actionData.teamBScore + 1;
      }

      // Swep receiver with receiving partner
      const tempReceiver = actionData.receiver;
      actionData.receiver = actionData.receivingPartner;
      actionData.receivingPartner = tempReceiver;

      // Track number of update
      actionData.mutate += 1;
      await this.gatewayRedisService.setAction(NET_CACHE_KEY, actionData);

      // Response back
      await this.gatewayRedisService.publishToRoom(
        aceNoTouchInput.room,
        'ace-no-touch-from-server',
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
