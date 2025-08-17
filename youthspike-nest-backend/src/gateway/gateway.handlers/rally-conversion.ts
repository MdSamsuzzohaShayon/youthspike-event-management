import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, RallyConversionInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { EServerReceiverAction } from 'src/server-receiver-on-net/server-receiver-on-net.schema';

export class RallyConversionHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: RallyConversionInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      // Receiving team Scores
      /* 1️⃣ load “net” action + team splits */
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room);
      const { teamA, teamB } = await this.scoreKeeperHelper.getTeamSets(body.net);

      /* 2️⃣ load / initialise the four player stat docs */
      const ids = [net.server, net.servingPartner, net.receiver, net.receivingPartner];
      const stats = await this.scoreKeeperHelper.getPlayerStats(body.net, net.match as string, ids as string[]);

      /* 3️⃣ mutate the stats (only the deltas differ per handler) */
      this.scoreKeeperHelper.increment(stats[net.server as string], {
        serveOpportunity: 1,
        serveCompletionCount: 1,
        defensiveOpportunity: 2,
        defensiveConversion: 1
      });

      this.scoreKeeperHelper.increment(stats[net.servingPartner as string], {
        defensiveOpportunity: 2,
        defensiveConversion: 1
      });
      
      this.scoreKeeperHelper.increment(stats[net.receiver as string], {
        receiverOpportunity: 1,
        receivedCount: 1,
        hittingOpportunity: 1,
        defensiveOpportunity: 1,
        defensiveConversion: 1
      });

      this.scoreKeeperHelper.increment(stats[net.receivingPartner as string], {
        settingOpportunity: 1,
        defensiveOpportunity: 1,
        defensiveConversion: 1
      });

      /* 4️⃣ save the four player docs in parallel */
      await this.scoreKeeperHelper.savePlayerStats(stats);


      /* 5️⃣ scoring + rotation */
      const scoringTeam = teamA.has(net.receiver as string) ? 'A' : 'B';
      this.scoreKeeperHelper.updateScore(net, scoringTeam);

      
      const currNetObj = structuredClone(net); // Without increment of mutate and play
      net.mutate += 1;
      net.play += 1;

      // After updating point check is the number odd or even
      const receivingTeamScore: number = teamA.has(net.receiver as string) ? net.teamAScore : net.teamBScore;
      this.scoreKeeperHelper.rotateServerReceiver(net, receivingTeamScore);

      /* 6️⃣ persist & broadcast */
      const singlePlayNet = {...currNetObj, action: EServerReceiverAction.RECEIVER_RALLEY_CONVERSION};
      delete singlePlayNet.mutate;

      const currSinglePlayObj = this.scoreKeeperHelper.normalizeSinglePlay(singlePlayNet);
      await Promise.all([
        this.scoreKeeperHelper.saveNetAction(body.net, body.room, net),
        this.scoreKeeperHelper.saveNetSinglePlayAction(body.net, body.room, singlePlayNet),
        this.scoreKeeperHelper.publishRoom(body.room, 'rally-conversion-from-server', {serverReceiverOnNet: net, singlePlay: currSinglePlayObj})
      ]);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
