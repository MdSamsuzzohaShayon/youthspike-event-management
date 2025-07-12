import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import {
  UpdateCachePointsInput,
  RoundUpdatedResponse,
  MatchRoundNet,
  RoomLocal,
  INetScoreUpdate,
} from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';

export class UpdateCachePointsHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: UpdateCachePointsInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      const net = await this.scoreKeeperHelper.loadNetAction(body.net, body.room);

      const { netService, playerStatsService, playerService, roundService, serverReceiverOnNetService } =
        this.gatewayService.getServices();

      // Update net score - no need to wait for this before proceeding
      const netUpdatePromise = netService.updateOne(
        { _id: body.net },
        { $set: { teamAScore: net.teamAScore, teamBScore: net.teamBScore } },
      );

      const serverReceiverOnNetPromises = [];
      const serverReceiverOnNetExist = await serverReceiverOnNetService.findOne({ net: body.net });
      if (serverReceiverOnNetExist) {
        await serverReceiverOnNetService.updateOne({ _id: serverReceiverOnNetExist._id }, net);
        if (net.server !== serverReceiverOnNetExist.server.toString()) {
          // Pull from previous record
          serverReceiverOnNetPromises.push(
            playerService.updateOne(
              { serverReceiverOnNet: net.server },
              { $pull: { serverReceiverOnNet: net.server } },
            ),
          );
          // Add to new player
          serverReceiverOnNetPromises.push(
            playerService.updateOne(
              { _id: serverReceiverOnNetExist.server },
              { $addToSet: { serverReceiverOnNet: net._id } },
            ),
          );
        }

        if (net.servingPartner !== serverReceiverOnNetExist.servingPartner.toString()) {
          // Pull from previous record
          serverReceiverOnNetPromises.push(
            playerService.updateOne(
              { serverReceiverOnNet: net.servingPartner },
              { $pull: { serverReceiverOnNet: net.receivingPartner } },
            ),
          );
          // Add to new player
          serverReceiverOnNetPromises.push(
            playerService.updateOne(
              { _id: serverReceiverOnNetExist.servingPartner },
              { $addToSet: { serverReceiverOnNet: net._id } },
            ),
          );
        }

        if (net.receiver !== serverReceiverOnNetExist.receiver.toString()) {
          // Pull from previous record
          serverReceiverOnNetPromises.push(
            playerService.updateOne(
              { serverReceiverOnNet: net.receiver },
              { $pull: { serverReceiverOnNet: net.receiver } },
            ),
          );
          // Add to new player
          serverReceiverOnNetPromises.push(
            playerService.updateOne(
              { _id: serverReceiverOnNetExist.receiver },
              { $addToSet: { serverReceiverOnNet: net._id } },
            ),
          );
        }

        if (net.receivingPartner !== serverReceiverOnNetExist.receivingPartner.toString()) {
          // Pull from previous record
          serverReceiverOnNetPromises.push(
            playerService.updateOne(
              { serverReceiverOnNet: net.receivingPartner },
              { $pull: { serverReceiverOnNet: net.receivingPartner } },
            ),
          );
          // Add to new player
          serverReceiverOnNetPromises.push(
            playerService.updateOne(
              { _id: serverReceiverOnNetExist.receivingPartner },
              { $addToSet: { serverReceiverOnNet: net._id } },
            ),
          );
        }
      } else {
        const createdSR = await serverReceiverOnNetService.create(net);
        serverReceiverOnNetPromises.push(
          playerService.updateOne({ _id: net.server }, { $addToSet: { serverReceiverOnNet: createdSR._id } }),
        );
        serverReceiverOnNetPromises.push(
          playerService.updateOne({ _id: net.receiver }, { $addToSet: { serverReceiverOnNet: createdSR._id } }),
        );
        serverReceiverOnNetPromises.push(
          playerService.updateOne({ _id: net.servingPartner }, { $addToSet: { serverReceiverOnNet: createdSR._id } }),
        );
        serverReceiverOnNetPromises.push(
          playerService.updateOne({ _id: net.receivingPartner }, { $addToSet: { serverReceiverOnNet: createdSR._id } }),
        );
      }

      const playerIds = [net.server, net.servingPartner, net.receiver, net.receivingPartner];
      // const stats = await this.scoreKeeperHelper.getPlayerStats(net.match, playerIds);
      const [stats, round] = await Promise.all([
        this.scoreKeeperHelper.getPlayerStats(net.match as string, playerIds as string[]),
        roundService.findById(net.round as string),
      ]);

      // Process player stats updates in parallel
      const playerUpdatePromises = Object.entries(stats).map(async ([playerId, statsData]) => {
        const updateResult = await playerStatsService.updateOne({ player: playerId }, statsData);

        if (updateResult.modifiedCount === 0) {
          const newPlayerStats = await playerStatsService.create(statsData);
          await playerService.updateOne({ _id: playerId }, { $set: { playerstats: newPlayerStats._id } });
        }
      });

      // Wait for all updates to complete
      await Promise.all([netUpdatePromise, ...playerUpdatePromises]);

      const netsOfRound = await netService.find({ round: round._id });
      const nets: INetScoreUpdate[] = netsOfRound.map((n) => ({
        _id: n._id,
        teamAScore: n.teamAScore,
        teamBScore: n.teamBScore,
        completed: false,
      }));

      const pointsResponse: RoundUpdatedResponse = {
        nets,
        room: body.room,
        round: {
          _id: round._id,
          teamAScore: round.teamAScore,
          teamBScore: round.teamBScore,
          completed: round.completed,
        },
        matchCompleted: false,
        teamAProcess: round.teamAProcess,
        teamBProcess: round.teamBProcess,
      };

      const presizedRoundData: MatchRoundNet = {
        nets,
        _id: round._id,
        match: body.match,
        matchCompleted: pointsResponse.matchCompleted,
      };

      await Promise.all([
        this.scoreKeeperHelper.publishRoom(body.room, 'update-points-response-all', pointsResponse),
        this.scoreKeeperHelper.publishRoom(body.room, 'net-update-all-pages', presizedRoundData),
      ]);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
