import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, ReceivingHittingErrorInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';

export class ReceivingHittingErrorHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ReceivingHittingErrorInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      // Receiving team Scores
      /* 1️⃣ load “net” action + team splits */
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room);
      const { teamA, teamB } = await this.scoreKeeperHelper.getTeamSets(body.net);

      /* 2️⃣ load / initialise the four player stat docs */
      const ids = [net.server, net.receiver, net.receivingPartner];
      const stats = await this.scoreKeeperHelper.getPlayerStats(net.match, ids);

      /* 3️⃣ mutate the stats (only the deltas differ per handler) */
      this.scoreKeeperHelper.increment(stats[net.server], {
        serveOpportunity: 1,
        serveCompletionCount: 1,
        break: 1
      });

      this.scoreKeeperHelper.increment(stats[net.receiver], {
        receiverOpportunity: 1,
        receivedCount: 1,
        hittingOpportunity: 1,
        broken: 1,
      });

      this.scoreKeeperHelper.increment(stats[net.receivingPartner], {
        settingOpportunity: 1,
      });

      /* 4️⃣ save the four player docs in parallel */
      await this.scoreKeeperHelper.savePlayerStats(stats);

      /* 5️⃣ scoring + rotation */
      const scoringTeam = teamA.has(net.receiver) ? 'A' : 'B';
      this.scoreKeeperHelper.updateScore(net, scoringTeam);

      this.scoreKeeperHelper.rotateServerReceiver(net);
      net.mutate += 1;

      /* 6️⃣ persist & broadcast */
      await this.scoreKeeperHelper.saveNetAction(body.net, body.room, net);
      await this.scoreKeeperHelper.publishRoom(body.room, 'receiving-hitting-error-from-server', net);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
