import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AceNoThirdTouchInput } from '../gateway.types';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { EServerReceiverAction } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { PointsUpdateHelper } from '../gateway.helpers/points-update.helper';

export class AceNoThirdTouchHandler {
  constructor(
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
    private readonly pointsUpdateHelper: PointsUpdateHelper,
  ) {}

  async handle(@ConnectedSocket() client: Socket, @MessageBody() body: AceNoThirdTouchInput, server: Server) {
    try {
      // Serving team Scores
      /* 1️⃣ load “net” action + team splits */
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room);
      const { teamA } = await this.scoreKeeperHelper.getTeamSets(body.net);

      /* 2️⃣ load / initialise the four player stat docs */
      const ids = [net.server, net.receiver, net.servingPartner, net.receivingPartner];
      const stats = await this.scoreKeeperHelper.getPlayerStats(body.net, net.match as string, ids as []);

      // Player stats
      const aceStats = this.pointsUpdateHelper.statsAceNoThird();

      /* 3️⃣ mutate the stats (only the deltas differ per handler) */
      const serverUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.server as string], aceStats.server);
      const servingPartnerUpdatedKeys = this.scoreKeeperHelper.increment(
        stats[net.servingPartner as string],
        aceStats.servingPartner,
      );

      const receiverUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.receiver as string], aceStats.receiver);

      const receivingPartnerUpdatedKeys = this.scoreKeeperHelper.increment(
        stats[net.receivingPartner as string],
        aceStats.receivingPartner,
      );

      /* 4️⃣ save the four player docs in parallel */
      await this.scoreKeeperHelper.savePlayerStats(stats);

      /* 5️⃣ scoring + rotation */
      const scoringTeam = teamA.has(net.server as string) ? 'A' : 'B';
      this.scoreKeeperHelper.updateScore(net, scoringTeam);

      // After rotation it will be changed for next play
      const serverBefore = String(net.server);
      const receiverBefore = String(net.receiver);
      const servingPartnerBefore = String(net.servingPartner);
      const receivingPartnerBefore = String(net.receivingPartner);

      // Rotation logic
      this.scoreKeeperHelper.rotateReceiver(net);
      const currNetObj = structuredClone(net); // Without increment of mutate and play
      net.mutate += 1;
      net.play += 1;

      /* 6️⃣ persist & broadcast */
      const singlePlayNet = { ...currNetObj, action: EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH };
      delete singlePlayNet.mutate;

      // Organize data
      const playersStats: Record<string, Partial<PlayerStats>> = {
        [serverBefore]: this.scoreKeeperHelper.extractUpdatedStats(stats[serverBefore], serverUpdatedKeys),
        [receiverBefore]: this.scoreKeeperHelper.extractUpdatedStats(stats[receiverBefore], receiverUpdatedKeys),
        [servingPartnerBefore]: this.scoreKeeperHelper.extractUpdatedStats(
          stats[servingPartnerBefore],
          servingPartnerUpdatedKeys,
        ),
        [receivingPartnerBefore]: this.scoreKeeperHelper.extractUpdatedStats(
          stats[receivingPartnerBefore],
          receivingPartnerUpdatedKeys,
        ),
      };
      const playerRooms = [serverBefore, receiverBefore, servingPartnerBefore, receivingPartnerBefore];

      const currSinglePlayObj = this.scoreKeeperHelper.normalizeSinglePlay(singlePlayNet);
      await Promise.all([
        this.scoreKeeperHelper.saveNetAction(body.net, body.room, net),
        this.scoreKeeperHelper.saveNetSinglePlayAction(body.net, body.room, singlePlayNet),
        this.scoreKeeperHelper.publishRoom(body.room, 'ace-no-third-touch-from-server', {
          serverReceiverOnNet: net,
          singlePlay: currSinglePlayObj,
        }),
        server.to(playerRooms).emit('update-player-stats-from-server', playersStats),
      ]);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
