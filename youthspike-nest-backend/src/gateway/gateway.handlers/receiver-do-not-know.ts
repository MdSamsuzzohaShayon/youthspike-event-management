import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, ReceiverDoNotKnowInput, ServiceFaultInput, EPlayStrategy } from '../gateway.types';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { EServerReceiverAction } from 'src/server-receiver-on-net/server-receiver-on-net.schema';

export class ReceiverDoNotKnowHandler {
  constructor(private readonly scoreKeeperHelper: ScoreKeeperHelper) { }

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

      // Single play object
      const currNetObj = structuredClone(net); // Without increment of mutate and play
      const singlePlayNet = { ...currNetObj, action: EServerReceiverAction.RECEIVER_DO_NOT_KNOW };
      delete singlePlayNet.mutate;
      const currSinglePlayObj = this.scoreKeeperHelper.normalizeSinglePlay(singlePlayNet);

      // After updating point check is the number odd or even
      const receivingTeamScore: number = teamA.has(net.receiver as string) ? net.teamAScore : net.teamBScore;
      // this.scoreKeeperHelper.rotateServerReceiver(net, receivingTeamScore);
      // Rotation strategy will depend on selected item from frontend
      if (body.playStrategy === EPlayStrategy.EQUAL_SERVING) {
        /**
         * Check previous play
         * If the server was also server in the previous play then change him otherwise keep him
         * If the server stays then the position will be changes
         */
        // const serverReceiverOnNetExist = await serverReceiverOnNetService.findOne({ net: body.net });
        if (net.mutate > 1) {
          const allSinglePlays = await this.scoreKeeperHelper.loadAllSinglePlayAction(body.net, body.room, net.mutate);
          const previousPlay = allSinglePlays.find((play) => play.play === net.mutate - 1);
          if (!previousPlay) {
            throw new Error("Previous play did not match for this strategy, try reverting or reseting all plays!")
          }
          // Same person has served twice, so server receiver both will be changed
          if (previousPlay.server === net.server) {
            const twoStepBack = allSinglePlays.find((play)=> play.play === net.mutate - 2);
            const previousServerOfOtherTeam = twoStepBack?.server ? String(twoStepBack?.server) : null;
            this.scoreKeeperHelper.rotateServerReceiverEqualScoring(net, previousServerOfOtherTeam);
          } else {
            // This person is new server, so only receiver will be changed
            this.scoreKeeperHelper.rotateReceiverEqualScoring(net);
          }
          // Check previous net, if he was in the previous net then change to new net
        } else {
          // no previous net exist 
          // Same person will be setver but receiver will be changed
          this.scoreKeeperHelper.rotateServerReceiverEqualScoring(net, null);
        }
      } else {
        // Previous strategy - Strategy A
        this.scoreKeeperHelper.rotateServerReceiver(net, receivingTeamScore);
      }
      net.mutate += 1;
      net.play += 1;

      /* 6️⃣ persist & broadcast */
      await Promise.all([
        this.scoreKeeperHelper.saveNetAction(body.net, body.room, net),
        this.scoreKeeperHelper.saveNetSinglePlayAction(body.net, body.room, singlePlayNet),
        this.scoreKeeperHelper.publishRoom(body.room, 'receiver-do-not-know-from-server', {
          serverReceiverOnNet: net,
          singlePlay: currSinglePlayObj,
        }),
      ]);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
