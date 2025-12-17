import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ResetScoreInput, RoomLocal } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { singlePlayKey } from 'src/utils/helper';
import { ValidationHelper } from '../gateway.helpers/validation.helper';

export class ResetScoreHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly validationHelper: ValidationHelper,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ResetScoreInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      const { netService, playerStatsService, playerService, roundService, serverReceiverOnNetService, matchService, jwtService } =
        this.gatewayService.getServices();

      const [net, match] = await Promise.all([
        this.scoreKeeperHelper.loadNetAction(body.net, body.room),
        matchService.findById(body.match),
      ]);

      // ✅ Check if body.accessCode is a valid JWT OR matches stored accessCode
      this.validationHelper.authCheck(body?.accessCode || null, jwtService, match?.accessCode || null);

      const playKeys = new Set<string>();
      for (let i = 0; i < net.mutate; i++) {
        const key = singlePlayKey(body.net, body.room, i + 1);
        playKeys.add(key);
      }

      const cachedPlays = await Promise.all([...playKeys].map((key) => this.scoreKeeperHelper.getSinglePlays(key)));
      const deletePlayPromises = [];
      const playIds = new Set<string>();
      const playerIdsOfAllPlay = new Set<string>();
      for (const play of cachedPlays.flat()) {
        if (play?._id) {
          playIds.add(play._id);
          // Has relationships
          // net, match, server, receiver, servingPartner, receivingPartner
          if (play.server) playerIdsOfAllPlay.add(String(play.server));
          if (play.servingPartner) playerIdsOfAllPlay.add(String(play.servingPartner));
          if (play.receiver) playerIdsOfAllPlay.add(String(play.receiver));
          if (play.receivingPartner) playerIdsOfAllPlay.add(String(play.receivingPartner));
        }

        // Delete all play cached
        deletePlayPromises.push(this.scoreKeeperHelper.deleteSinglePlayAction(body.net, body.room, play.play));
      }

      deletePlayPromises.push(
        matchService.updateOne({ _id: body.match }, { $pullAll: { serverReceiverSinglePlay: [...playIds] } }),
      );
      deletePlayPromises.push(
        netService.updateOne({ _id: body.net }, { $pullAll: { serverReceiverSinglePlay: [...playIds] } }),
      );
      deletePlayPromises.push(
        playerService.updateMany(
          { _id: { $in: [...playerIdsOfAllPlay] } },
          { $pullAll: { serverReceiverSinglePlay: [...playIds] } },
        ),
      );

      await Promise.all(deletePlayPromises);

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
        serverReceiverOnNetService.deleteMany({ net: body.net }),

        // Remove redis action
        this.scoreKeeperHelper.deleteNetAction(body.net, body.room),
      ]);

      // Check and remove linked serverReceiverOnNet
      const serverReceiverOnNet = await serverReceiverOnNetService.findOne({ net: body.net });
      if (serverReceiverOnNet) {
        const srId = serverReceiverOnNet?._id;

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

      await serverReceiverOnNetService.deleteManySinglePlay({net: body.net});

      // Notify room
      await this.scoreKeeperHelper.publishRoom(body.room, 'reset-score-from-server', {
        net: body.net,
      });
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
