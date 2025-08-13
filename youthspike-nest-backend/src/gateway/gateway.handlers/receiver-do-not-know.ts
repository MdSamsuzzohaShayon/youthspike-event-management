import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, ReceiverDoNotKnowInput, ServiceFaultInput } from '../gateway.types';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { EServerReceiverAction } from 'src/server-receiver-on-net/server-receiver-on-net.schema';

export class ReceiverDoNotKnowHandler {
  constructor(private readonly scoreKeeperHelper: ScoreKeeperHelper) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ReceiverDoNotKnowInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      /* 1️⃣ load “net” action + team splits */
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room); // Redis key: <sr:net:room>
      const { teamA, teamB } = await this.scoreKeeperHelper.getTeamSets(body.net);

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
      const singlePlayNet = {...currNetObj, action: EServerReceiverAction.RECEIVER_DO_NOT_KNOW};
      delete singlePlayNet.mutate;

      const currSinglePlayObj = this.scoreKeeperHelper.normalizeSinglePlay(singlePlayNet);

      /* 6️⃣ persist & broadcast */
      await Promise.all([
        this.scoreKeeperHelper.saveNetAction(body.net, body.room, net),
        this.scoreKeeperHelper.saveNetSinglePlayAction(body.net, body.room, singlePlayNet),
        this.scoreKeeperHelper.publishRoom(body.room, 'receiver-do-not-know-from-server', {serverReceiverOnNet: net, singlePlay: currSinglePlayObj}),
      ]);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
