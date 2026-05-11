import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AceNoTouchInput, EPlayStrategy } from '../gateway.types';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { EServerReceiverAction } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { PointsUpdateHelper } from '../gateway.helpers/points-update.helper';

export class AceNoTouchHandler {
  constructor(
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
    private readonly pointsUpdateHelper: PointsUpdateHelper,
  ) {}

  async handle(@ConnectedSocket() client: Socket, @MessageBody() body: AceNoTouchInput, server: Server) {
    try {
      /* 1️⃣ load “net” action + team splits */
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room);
      const { teamA, teamB } = await this.scoreKeeperHelper.getTeamSets(body.net);

      /* 2️⃣ load / initialise the four player stat docs */
      const ids = [net.server, net.receiver];
      const stats = await this.scoreKeeperHelper.getPlayerStats(body.net, net.match as string, body.event, ids as string[]);

      const aceStats = this.pointsUpdateHelper.statsAceNoTouch();

      /* 3️⃣ mutate the stats (only the deltas differ per handler) */
      const serverUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.server as string], aceStats.server);

      const receiverUpdatedKeys = this.scoreKeeperHelper.increment(stats[net.receiver as string], aceStats.receiver);

      /* 4️⃣ save the four player docs in parallel */
      await this.scoreKeeperHelper.savePlayerStats(stats, body.event);



      /* 5️⃣ scoring + rotation */
      const scoringTeam = teamA.has(net.server as string) ? 'A' : 'B';
      this.scoreKeeperHelper.updateScore(net, scoringTeam);

      // Create single play object
      const singlePlayNet = { ...net, action: EServerReceiverAction.SERVER_ACE_NO_TOUCH };
      delete singlePlayNet.mutate;
      const currSinglePlayObj = this.scoreKeeperHelper.normalizeSinglePlay(singlePlayNet);

      // After rotation it will be changed for next play
      const serverBefore = String(net.server);
      const receiverBefore = String(net.receiver);

      // Rotation strategy will depend on selected item from frontend
      if(body.playStrategy === EPlayStrategy.EQUAL_SERVING){
        /**
         * Check previous play
         * If the server was also server in the previous play then change him otherwise keep him
         * If the server stays then the position will be changes
         */
        // const serverReceiverOnNetExist = await serverReceiverOnNetService.findOne({ net: body.net });
        if(net.mutate > 1){
          const allSinglePlays = await this.scoreKeeperHelper.loadAllSinglePlayAction(body.net, body.room, net.mutate);
          const previousPlay = allSinglePlays.find((play)=> play.play === net.mutate - 1);
          if(!previousPlay) {
            throw new Error("Previous play did not match for this strategy, try reverting or reseting all plays!")
          }
          // Same person has served twice, so server receiver both will be changed
          if(previousPlay.server === net.server){
            const receivingTeamScore: number = teamA.has(net.receiver as string) ? net.teamAScore : net.teamBScore;
            this.scoreKeeperHelper.rotateServerReceiverEqualScoring(net);
          }else{
            // This person is new server, so only receiver will be changed
            this.scoreKeeperHelper.rotateReceiverEqualScoring(net);
          }
          // Check previous net, if he was in the previous net then change to new net
        }else{
          // no previous net exist 
          // Same person will be setver but receiver will be changed
          this.scoreKeeperHelper.rotateReceiverEqualScoring(net);
        }
      }else{
        // Previous strategy - Strategy A
        this.scoreKeeperHelper.rotateReceiver(net);
      }

      net.mutate += 1;
      net.play += 1;

      const playersStats: Record<string, Partial<PlayerStats>> = {
        [serverBefore]: this.scoreKeeperHelper.extractUpdatedStats(stats[serverBefore], serverUpdatedKeys),
        [receiverBefore]: this.scoreKeeperHelper.extractUpdatedStats(stats[receiverBefore], receiverUpdatedKeys),
      };

      const playerRooms = [serverBefore, receiverBefore];

      await Promise.all([
        this.scoreKeeperHelper.saveNetAction(body.net, body.room, net),
        this.scoreKeeperHelper.saveNetSinglePlayAction(body.net, body.room, singlePlayNet),
        this.scoreKeeperHelper.publishRoom(body.room, 'ace-no-touch-from-server', {
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
