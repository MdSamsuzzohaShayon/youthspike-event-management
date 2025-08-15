import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AceNoThirdTouchInput } from '../gateway.types';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { EServerReceiverAction } from 'src/server-receiver-on-net/server-receiver-on-net.schema';

export class AceNoThirdTouchHandler {
  constructor(
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: AceNoThirdTouchInput,
  ) {
    try {
      // Serving team Scores
      /* 1️⃣ load “net” action + team splits */
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room);
      const { teamA, teamB } = await this.scoreKeeperHelper.getTeamSets(body.net);

      /* 2️⃣ load / initialise the four player stat docs */
      const ids = [net.server, net.receiver, net.receivingPartner];
      const stats = await this.scoreKeeperHelper.getPlayerStats(body.net, net.match as string, ids as []);

      /* 3️⃣ mutate the stats (only the deltas differ per handler) */
      this.scoreKeeperHelper.increment(stats[net.server as string], {
        serveOpportunity: 1,
        serveCompletionCount: 1,
        serveAce: 1,
        break: 1,
      });

      this.scoreKeeperHelper.increment(stats[net.receiver as string], {
        receiverOpportunity: 1,
        receivedCount: 1,
        broken: 1,
      });

      this.scoreKeeperHelper.increment(stats[net.receivingPartner as string], {
        settingOpportunity: 1,
      });

      /* 4️⃣ save the four player docs in parallel */
      await this.scoreKeeperHelper.savePlayerStats(stats);

      /* 5️⃣ scoring + rotation */
      const scoringTeam = teamA.has(net.server as string) ? 'A' : 'B';
      this.scoreKeeperHelper.updateScore(net, scoringTeam);

      this.scoreKeeperHelper.rotateReceiver(net);
      const currNetObj = structuredClone(net); // Without increment of mutate and play
      net.mutate += 1;
      net.play += 1;

      /* 6️⃣ persist & broadcast */
      const singlePlayNet = {...currNetObj, action: EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH};
      delete singlePlayNet.mutate;

      const currSinglePlayObj = this.scoreKeeperHelper.normalizeSinglePlay(singlePlayNet);
      await Promise.all([
        this.scoreKeeperHelper.saveNetAction(body.net, body.room, net),
        this.scoreKeeperHelper.saveNetSinglePlayAction(body.net, body.room, singlePlayNet),
        this.scoreKeeperHelper.publishRoom(body.room, 'ace-no-third-touch-from-server', {serverReceiverOnNet: net, singlePlay: currSinglePlayObj})
      ]);


    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
