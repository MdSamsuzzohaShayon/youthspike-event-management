import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import {
  ResetScoreInput,
  RoomLocal,
} from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';

export class ResetScoreHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ResetScoreInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      const {
        netService,
        playerStatsService,
        playerService,
        roundService,
        serverReceiverOnNetService,
        matchService,
      } = this.gatewayService.getServices();

      const [net, match] = await Promise.all([
        this.scoreKeeperHelper.loadNetAction(body.net, body.room),
        matchService.findById(body.match),
      ]);

      if (!match?.accessCode || match.accessCode !== body.accessCode) {
        throw new Error('Permission denied: Invalid access code.');
      }

      const playerIds: string[] = [
        net.server as string,
        net.receiver as string,
        net.servingPartner as string,
        net.receivingPartner as string,
      ];

      // Parallel cleanup
      await Promise.all([
        // Reset net scores
        netService.updateOne({ _id: body.net }, { $set: { teamAScore: 0, teamBScore: 0 } }),

        // Remove server-receiver link
        serverReceiverOnNetService.delete({ net: body.net }),

        // Remove redis action
        this.scoreKeeperHelper.deleteNetAction(body.net, body.room),
      ]);

      // Check and remove linked serverReceiverOnNet
      const serverReceiverOnNet = await serverReceiverOnNetService.findOne({ net: body.net });
      if (serverReceiverOnNet) {
        const srId = serverReceiverOnNet._id;

        // Batch remove from all documents
        await Promise.all([
          playerService.updateMany({ _id: { $in: playerIds } }, { $pull: { serverReceiverOnNet: srId } }),
          matchService.updateOne({ _id: body.match }, { $pull: { serverReceiverOnNet: srId } }),
          roundService.updateOne({ _id: net.round }, { $pull: { serverReceiverOnNet: srId } }),
          netService.updateOne({ _id: body.net }, { $set: { serverReceiverOnNet: null } }),
        ]);
      }

      // Clear player stats from cache and DB
      await this.scoreKeeperHelper.deletePlayerStats(body.net, playerIds);

      const playerStats = await playerStatsService.find({
        player: { $in: playerIds },
        net: body.net,
      });

      if (playerStats.length > 0) {
        const statsIds = playerStats.map((ps) => ps._id);

        await Promise.all([
          playerStatsService.deleteMany({ _id: { $in: statsIds } }),
          matchService.updateOne({ _id: body.match }, { $pull: { serverReceiverOnNet: { $in: statsIds } } }),
          playerService.updateMany({ _id: { $in: playerIds } }, { $pull: { serverReceiverOnNet: { $in: statsIds } } }),
          netService.updateOne({ _id: body.net }, { $pull: { serverReceiverOnNet: { $in: statsIds } } }),
        ]);
      }

      // Notify room
      await this.scoreKeeperHelper.publishRoom(body.room, 'reset-score-from-server', {
        net: body.net,
      });
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
