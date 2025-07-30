import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, ServerDoNotKnowInput, ServiceFaultInput } from '../gateway.types';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';

export class ServerDoNotKnowHandler {
  constructor(
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ServerDoNotKnowInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      /* 1️⃣ load “net” action + team splits */
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room); // Redis key: <sr:net:room>
      const { teamA, teamB } = await this.scoreKeeperHelper.getTeamSets(body.net);


      /* 5️⃣ scoring + rotation */
      const scoringTeam = teamA.has(net.server as string) ? 'A' : 'B';
      this.scoreKeeperHelper.updateScore(net, scoringTeam);

      this.scoreKeeperHelper.rotateReceiver(net);
      net.mutate += 1;
      net.play += 1;

      /* 6️⃣ persist & broadcast */
      await this.scoreKeeperHelper.saveNetAction(body.net, body.room, net);
      await this.scoreKeeperHelper.publishRoom(body.room, 'server-do-not-know-from-server', net);

    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
