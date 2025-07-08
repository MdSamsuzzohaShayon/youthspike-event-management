import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, ServerReceiverOnNet, DefensiveConversionInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { initPlayerStat } from 'src/util/helper';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';

export class DefensiveConversionHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: DefensiveConversionInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      /* 1️⃣ load “net” action + team splits */
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room);
      const { teamA, teamB } = await this.scoreKeeperHelper.getTeamSets(body.net);

      /* 2️⃣ load / initialise the four player stat docs */
      const ids = [net.server, net.servingPartner, net.receiver, net.receivingPartner];
      const stats = await this.scoreKeeperHelper.getPlayerStats(net.match, ids);

      /* 3️⃣ mutate the stats (only the deltas differ per handler) */
      this.scoreKeeperHelper.increment(stats[net.server], {
        serveOpportunity: 1,
        serveCompletionCount: 1,
        defensiveOpportunity: 0.5,
      });

      this.scoreKeeperHelper.increment(stats[net.servingPartner], {
        defensiveOpportunity: 0.5
      });

      this.scoreKeeperHelper.increment(stats[net.receiver], {
        receiverOpportunity: 1,
        receivedCount: 1,
        hittingOpportunity: 1,
        hittingCompletion: 1,
        cleanHits: 1,
        defensiveOpportunity: 0.5,
        defensiveConversion: 0.5,
      });

      this.scoreKeeperHelper.increment(stats[net.receivingPartner], {
        settingOpportunity: 1,
        settingCompletion: 1,
        defensiveOpportunity: 0.5,
        defensiveConversion: 0.5,
      });

      /* 4️⃣ save the four player docs in parallel */
      await this.scoreKeeperHelper.savePlayerStats(stats);

      /* 5️⃣ scoring + rotation */
      const scoringTeam = teamA.has(net.server) ? 'A' : 'B';
      this.scoreKeeperHelper.updateScore(net, scoringTeam);

      this.scoreKeeperHelper.rotateServer(net);
      net.mutate += 1;

      /* 6️⃣ persist & broadcast */
      await this.scoreKeeperHelper.saveNetAction(body.net, body.room, net);
      await this.scoreKeeperHelper.publishRoom(body.room, 'defensive-conversion-from-server', net);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
