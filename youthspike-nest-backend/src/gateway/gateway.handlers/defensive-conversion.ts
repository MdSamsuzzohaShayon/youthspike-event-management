import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DefensiveConversionInput } from '../gateway.types';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { EServerReceiverAction } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { PlayerStats } from 'src/player-stats/player-stats.schema';

export class DefensiveConversionHandler {
  constructor(private readonly scoreKeeperHelper: ScoreKeeperHelper) {}

  async handle(@ConnectedSocket() client: Socket, @MessageBody() body: DefensiveConversionInput, server: Server) {
    try {
      /* 1️⃣ load “net” action + team splits */
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room);
      const { teamA, teamB } = await this.scoreKeeperHelper.getTeamSets(body.net);

      /* 2️⃣ load / initialise the four player stat docs */
      const ids = [net.server, net.servingPartner, net.receiver, net.receivingPartner];
      const stats = await this.scoreKeeperHelper.getPlayerStats(body.net, net.match as string, ids as string[]);

      /* 3️⃣ mutate the stats (only the deltas differ per handler) */
      const serverUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.server as string], {
        serveOpportunity: 1,
        serveCompletionCount: 1,
        defensiveOpportunity: 1,
        defensiveConversion: 1,
        break: 0.5,
      });

      const servingPartnerUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.servingPartner as string], {
        defensiveOpportunity: 1,
        defensiveConversion: 1,
        break: 0.5,
      });

      const receiverUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.receiver as string], {
        receiverOpportunity: 1,
        receivedCount: 1,
        hittingOpportunity: 1,
        defensiveOpportunity: 1,
        broken: -0.5,
      });

      const receivingPartnerUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.receivingPartner as string], {
        settingOpportunity: 1,
        defensiveOpportunity: 1,
        broken: -0.5,
      });

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

      this.scoreKeeperHelper.rotateReceiver(net);
      const currNetObj = structuredClone(net); // Without increment of mutate and play
      net.mutate += 1;
      net.play += 1;

      /* 6️⃣ persist & broadcast */
      const singlePlayNet = { ...currNetObj, action: EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION };
      delete singlePlayNet.mutate;

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
        this.scoreKeeperHelper.publishRoom(body.room, 'defensive-conversion-from-server', {
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
