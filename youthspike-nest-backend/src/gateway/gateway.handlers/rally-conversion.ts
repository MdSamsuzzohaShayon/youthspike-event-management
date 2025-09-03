import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomLocal, RallyConversionInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { EServerReceiverAction } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { PointsUpdateHelper } from '../gateway.helpers/points-update.helper';

export class RallyConversionHandler {
  constructor(
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
    private readonly pointsUpdateHelper: PointsUpdateHelper 
  ){}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: RallyConversionInput,
    server: Server,
  ) {
    try {
      // Receiving team Scores
      /* 1️⃣ load “net” action + team splits */
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room);
      const { teamA, teamB } = await this.scoreKeeperHelper.getTeamSets(body.net);

      /* 2️⃣ load / initialise the four player stat docs */
      const ids = [net.server, net.servingPartner, net.receiver, net.receivingPartner];
      const stats = await this.scoreKeeperHelper.getPlayerStats(body.net, net.match as string, ids as string[]);


      const rallyStats = this.pointsUpdateHelper.statsRallyConversion();

      /* 3️⃣ mutate the stats (only the deltas differ per handler) */
      const serverUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.server as string], rallyStats.server);

      const servingPartnerUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.servingPartner as string], rallyStats.servingPartner);
      
      const receiverUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.receiver as string], rallyStats.receiver);

      const receivingPartnerUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.receivingPartner as string], rallyStats.receivingPartner);

      /* 4️⃣ save the four player docs in parallel */
      await this.scoreKeeperHelper.savePlayerStats(stats);


      /* 5️⃣ scoring + rotation */
      const scoringTeam = teamA.has(net.receiver as string) ? 'A' : 'B';
      this.scoreKeeperHelper.updateScore(net, scoringTeam);

      
      const currNetObj = structuredClone(net); // Without increment of mutate and play
      net.mutate += 1;
      net.play += 1;

      // After rotation it will be changed for next play
      const serverBefore = String(net.server);
      const receiverBefore = String(net.receiver);
      const servingPartnerBefore = String(net.servingPartner);
      const receivingPartnerBefore = String(net.receivingPartner);


      // After updating point check is the number odd or even
      const receivingTeamScore: number = teamA.has(net.receiver as string) ? net.teamAScore : net.teamBScore;
      this.scoreKeeperHelper.rotateServerReceiver(net, receivingTeamScore);

      /* 6️⃣ persist & broadcast */
      const singlePlayNet = {...currNetObj, action: EServerReceiverAction.RECEIVER_RALLEY_CONVERSION};
      delete singlePlayNet.mutate;

      // Organize data
      const playersStats: Record<string, Partial<PlayerStats>> = {
        [serverBefore]: this.scoreKeeperHelper.extractUpdatedStats(stats[serverBefore], serverUpdatedKeys),
        [receiverBefore]: this.scoreKeeperHelper.extractUpdatedStats(stats[receiverBefore], receiverUpdatedKeys),
        [servingPartnerBefore]: this.scoreKeeperHelper.extractUpdatedStats(stats[servingPartnerBefore], servingPartnerUpdatedKeys),
        [receivingPartnerBefore]: this.scoreKeeperHelper.extractUpdatedStats(stats[receivingPartnerBefore], receivingPartnerUpdatedKeys),
      };
      const playerRooms = [serverBefore, receiverBefore, servingPartnerBefore, receivingPartnerBefore];

      const currSinglePlayObj = this.scoreKeeperHelper.normalizeSinglePlay(singlePlayNet);
      await Promise.all([
        this.scoreKeeperHelper.saveNetAction(body.net, body.room, net),
        this.scoreKeeperHelper.saveNetSinglePlayAction(body.net, body.room, singlePlayNet),
        this.scoreKeeperHelper.publishRoom(body.room, 'rally-conversion-from-server', {serverReceiverOnNet: net, singlePlay: currSinglePlayObj}),
        server.to(playerRooms).emit('update-player-stats-from-server', playersStats),
      ]);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
