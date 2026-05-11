import { ConnectedSocket, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EPlayStrategy, RoomLocal, ServiceFaultInput } from '../gateway.types';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { EServerReceiverAction } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { PointsUpdateHelper } from '../gateway.helpers/points-update.helper';

export class ServiceFaultHandler {
  constructor(
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
    private readonly pointsUpdateHelper: PointsUpdateHelper,
  ) { }

  async handle(@ConnectedSocket() client: Socket, @MessageBody() body: ServiceFaultInput, server: Server) {
    try {
      // Award point to receiving team
      /* 1️⃣ load “net” action + team splits */
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room); // Redis key: <sr:net:room>
      const { teamA, teamB } = await this.scoreKeeperHelper.getTeamSets(body.net);

      /* 2️⃣ load / initialise the four player stat docs */
      const ids = [net.server];
      const stats = await this.scoreKeeperHelper.getPlayerStats(body.net, net.match as string, body.event, ids as string[]);

      const faultStats = this.pointsUpdateHelper.statsServiceFault();
      /* 3️⃣ mutate the stats (only the deltas differ per handler) */
      const updatedKeys = this.scoreKeeperHelper.increment(stats[net.server as string], faultStats.server);

      /* 4️⃣ save the four player docs in parallel */
      await this.scoreKeeperHelper.savePlayerStats(stats, body.event);

      /* 5️⃣ scoring + rotation */
      const scoringTeam = teamA.has(net.receiver as string) ? 'A' : 'B';
      this.scoreKeeperHelper.updateScore(net, scoringTeam);

      const singlePlayNet = { ...net, action: EServerReceiverAction.RECEIVER_SERVICE_FAULT };
      delete singlePlayNet.mutate;
      const currSinglePlayObj = this.scoreKeeperHelper.normalizeSinglePlay(singlePlayNet);

      // After rotation it will be changed for next play
      const serverBefore = String(net.server);

      // After updating point check is the number odd or even
      const receivingTeamScore: number = teamA.has(net.receiver as string) ? net.teamAScore : net.teamBScore;

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
            const receivingTeamScore: number = teamA.has(net.receiver as string) ? net.teamAScore : net.teamBScore;
            this.scoreKeeperHelper.rotateServerReceiverEqualScoring(net);
          } else {
            // This person is new server, so only receiver will be changed
            this.scoreKeeperHelper.rotateReceiverEqualScoring(net);
          }
          // Check previous net, if he was in the previous net then change to new net
        } else {
          // no previous net exist 
          // Same person will be setver but receiver will be changed
          this.scoreKeeperHelper.rotateReceiverEqualScoring(net);
        }
      } else {
        // Previous strategy - Strategy A
        this.scoreKeeperHelper.rotateServerReceiver(net, receivingTeamScore);
      }
      net.mutate += 1;
      net.play += 1;

      /* Send all updated player stats */
      const playersStats: Record<string, Partial<PlayerStats>> = {
        [serverBefore]: this.scoreKeeperHelper.extractUpdatedStats(stats[serverBefore], updatedKeys),
      };

      const playerRooms = [serverBefore];

      await Promise.all([
        this.scoreKeeperHelper.saveNetAction(body.net, body.room, net),
        this.scoreKeeperHelper.saveNetSinglePlayAction(body.net, body.room, singlePlayNet),
        this.scoreKeeperHelper.publishRoom(body.room, 'service-fault-from-server', {
          serverReceiverOnNet: net,
          singlePlay: currSinglePlayObj,
        }),
        // Update player stats
        server.to(playerRooms).emit('update-player-stats-from-server', playersStats),
      ]);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
