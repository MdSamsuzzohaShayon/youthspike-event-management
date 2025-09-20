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
import { PointsUpdateHelper } from '../gateway.helpers/points-update.helper';
import { ValidationHelper } from '../gateway.helpers/validation.helper';
import { ETieBreakingStrategy } from 'src/event/event.schema';

export class UpdateCachePointsHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly validationHelper: ValidationHelper,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: UpdateCachePointsInput,
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
        jwtService,
      } = this.gatewayService.getServices();

      const [net, match] = await Promise.all([
        this.scoreKeeperHelper.loadNetAction(body.net, body.room),
        matchService.findById(body.match),
      ]);

      const allSinglePlays = await this.scoreKeeperHelper.loadAllSinglePlayAction(body.net, body.room, net.mutate);

      // ✅ Check if body.accessCode is a valid JWT OR matches stored accessCode
      this.validationHelper.authCheck(body?.accessCode || null, jwtService, match?.accessCode || null);

      // Update net score - no need to wait for this before proceeding
      const netUpdatePromise = netService.updateOne(
        { _id: body.net },
        { $set: { teamAScore: net.teamAScore, teamBScore: net.teamBScore } },
      );

      const serverReceiverOnNetPromises = [];
      const serverReceiverOnNetExist = await serverReceiverOnNetService.findOne({ net: body.net });
      if (serverReceiverOnNetExist) {
        await serverReceiverOnNetService.updateOne({ _id: serverReceiverOnNetExist._id }, net);
        await Promise.all([
          serverReceiverOnNetService.updateOne({ _id: serverReceiverOnNetExist._id }, net),
          serverReceiverOnNetService.updateOneSinglePlay({ _id: serverReceiverOnNetExist._id }, net),
        ]);

        // Update current
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

        // Update single play
      } else {
        const createdSR = await serverReceiverOnNetService.create(net);

        // Update with server receiver on net
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

      const singlePlayPromises = Object.entries(allSinglePlays).map(async ([id, singlePlayData]) => {
        const serverReceiverSinglePlayExist = await serverReceiverOnNetService.findOneSinglePlay({
          $and: [
            {
              play: singlePlayData.play,
            },
            { net: body.net },
          ],
        });

        const spPromises = [];
        let singlePlayId = null;
        delete singlePlayData._id;
        if (serverReceiverSinglePlayExist) {
          delete singlePlayData.net;
          // Update
          const updatedSinglePlay = await serverReceiverOnNetService.updateOneSinglePlay(
            { _id: serverReceiverSinglePlayExist._id },
            singlePlayData,
          );
          singlePlayId = serverReceiverSinglePlayExist._id.toString();
          // Check server receiver change or not
          if (singlePlayData.server !== serverReceiverSinglePlayExist.server.toString()) {
            // Pull from previous record
            spPromises.push(
              playerService.updateOne(
                { serverReceiverSinglePlay: singlePlayData.server },
                { $pull: { serverReceiverSinglePlay: singlePlayData.server } },
              ),
            );
            // Add to new player
            spPromises.push(
              playerService.updateOne(
                { _id: serverReceiverSinglePlayExist.server },
                { $addToSet: { serverReceiverSinglePlay: singlePlayData._id } },
              ),
            );
          }

          if (singlePlayData.servingPartner !== serverReceiverSinglePlayExist.servingPartner.toString()) {
            // Pull from previous record
            spPromises.push(
              playerService.updateOne(
                { serverReceiverSinglePlay: singlePlayData.servingPartner },
                { $pull: { serverReceiverSinglePlay: singlePlayData.receivingPartner } },
              ),
            );
            // Add to new player
            spPromises.push(
              playerService.updateOne(
                { _id: serverReceiverSinglePlayExist.servingPartner },
                { $addToSet: { serverReceiverSinglePlay: singlePlayData._id } },
              ),
            );
          }

          if (singlePlayData.receiver !== serverReceiverSinglePlayExist.receiver.toString()) {
            // Pull from previous record
            serverReceiverOnNetPromises.push(
              playerService.updateOne(
                { serverReceiverSinglePlay: singlePlayData.receiver },
                { $pull: { serverReceiverSinglePlay: singlePlayData.receiver } },
              ),
            );
            // Add to new player
            serverReceiverOnNetPromises.push(
              playerService.updateOne(
                { _id: serverReceiverSinglePlayExist.receiver },
                { $addToSet: { serverReceiverSinglePlay: singlePlayData._id } },
              ),
            );
          }

          if (singlePlayData.receivingPartner !== serverReceiverSinglePlayExist.receivingPartner.toString()) {
            // Pull from previous record
            serverReceiverOnNetPromises.push(
              playerService.updateOne(
                { serverReceiverSinglePlay: singlePlayData.receivingPartner },
                { $pull: { serverReceiverSinglePlay: singlePlayData.receivingPartner } },
              ),
            );
            // Add to new player
            serverReceiverOnNetPromises.push(
              playerService.updateOne(
                { _id: serverReceiverSinglePlayExist.receivingPartner },
                { $addToSet: { serverReceiverSinglePlay: singlePlayData._id } },
              ),
            );
          }
        } else {
          const createdSRSinglePlay = await serverReceiverOnNetService.createSinglePlay(singlePlayData);
          singlePlayId = createdSRSinglePlay._id;
          // Update for single play
          spPromises.push(
            playerService.updateOne(
              { _id: singlePlayData.server },
              { $addToSet: { serverReceiverSinglePlay: createdSRSinglePlay._id } },
            ),
          );
          spPromises.push(
            playerService.updateOne(
              { _id: singlePlayData.receiver },
              { $addToSet: { serverReceiverSinglePlay: createdSRSinglePlay._id } },
            ),
          );
          spPromises.push(
            playerService.updateOne(
              { _id: singlePlayData.servingPartner },
              { $addToSet: { serverReceiverSinglePlay: createdSRSinglePlay._id } },
            ),
          );
          spPromises.push(
            playerService.updateOne(
              { _id: singlePlayData.receivingPartner },
              { $addToSet: { serverReceiverSinglePlay: createdSRSinglePlay._id } },
            ),
          );
        }

        // Update match, net
        // singlePlayId
        spPromises.push(
          matchService.updateOne(
            { _id: singlePlayData.match },
            { $addToSet: { serverReceiverSinglePlay: singlePlayId } },
          ),
        );
        spPromises.push(
          netService.updateOne({ _id: singlePlayData.net }, { $addToSet: { serverReceiverSinglePlay: singlePlayId } }),
        );

        await Promise.all(spPromises);
      });

      await Promise.all([...serverReceiverOnNetPromises, ...singlePlayPromises]);

      const playerIds = [net.server, net.servingPartner, net.receiver, net.receivingPartner];

      const [stats, round] = await Promise.all([
        this.scoreKeeperHelper.getPlayerStats(body.net, net.match as string, playerIds as string[]),
        roundService.findById(net.round as string),
      ]);

      // Process player stats updates in parallel
      const playerUpdatePromises = Object.entries(stats).map(async ([playerId, statsData]) => {
        // Must match player and net, then update
        const updateResult = await playerStatsService.updateOne(
          { $and: [{ player: playerId }, { net: statsData.net }] },
          statsData,
        );

        if (updateResult.modifiedCount === 0) {
          const newPlayerStats = await playerStatsService.create(statsData);
          // Update match, net, and player
          await Promise.all([
            playerService.updateOne({ _id: playerId }, { $addToSet: { playerstats: newPlayerStats._id } }),
            matchService.updateOne({ _id: body.match }, { $addToSet: { playerstats: newPlayerStats._id } }),
            netService.updateOne({ _id: body.net }, { $addToSet: { playerstats: newPlayerStats._id } }),
          ]);
        }
      });

      // Wait for all updates to complete
      await Promise.all([netUpdatePromise, ...playerUpdatePromises]);

      const netsOfRound = await netService.find({ round: round._id });
      // Check if all net has point then make round completed
      let teamAScore = 0,
        teamBScore = 0;
      let roundCompleted: boolean = true;
      for (const n of netsOfRound) {
        // Zero values are allowed
        if ((!n.teamAScore && n.teamAScore !== 0) || (!n.teamBScore && n.teamBScore !== 0)) {
          roundCompleted = false;
        }
        if (n.teamAScore) {
          teamAScore += n.teamAScore;
        }
        if (n.teamBScore) {
          teamBScore += n.teamBScore;
        }
      }

      let matchCompleted = false;
      if (roundCompleted) {
        // roundList
        const roundList = await roundService.find({ match: net.match });
        // Check this is last round or not
        const lastRound = roundList.reduce((max, current) => (current.num > max.num ? current : max), roundList[0]);

        if (match.tieBreaking === ETieBreakingStrategy.OVERTIME_ROUND) {
          if (match.extendedOvertime) {
            if (String(lastRound._id) === String(round._id)) {
              // Check teamA score and teamB score
              // if both do no match then match will be completed
              let teamARoundScore = 0,
                teamBRoundScore = 0;
              for (const r of roundList) {
                const roundNets = await netService.find({ round: r._id });
                for (const n of roundNets) {
                  if (n.teamAScore > n.teamBScore) {
                    teamARoundScore += n.points;
                  } else if (n.teamAScore < n.teamBScore) {
                    teamBRoundScore += n.points;
                  }
                }
              }
              if (teamARoundScore !== teamBRoundScore) {
                matchCompleted = true;
                await matchService.updateOne({ _id: body.match }, { $set: { completed: matchCompleted } });
              }
            }
          }
        } else {
          if (String(lastRound._id) === String(round._id)) {
            matchCompleted = true;
            await matchService.updateOne({ _id: body.match }, { $set: { completed: matchCompleted } });
          }
        }
      }

      const nets: INetScoreUpdate[] = netsOfRound.map((n) => ({
        _id: n._id,
        teamAScore: n.teamAScore,
        teamBScore: n.teamBScore,
      }));

      // Update round with new scores
      await roundService.updateOne({ _id: round._id }, { $set: { teamAScore, teamBScore, completed: roundCompleted } });

      const pointsResponse: RoundUpdatedResponse = {
        nets,
        room: body.room,
        round: {
          _id: round._id,
          teamAScore: teamAScore,
          teamBScore: teamBScore,
          completed: roundCompleted,
        },
        matchCompleted,
        teamAProcess: round.teamAProcess,
        teamBProcess: round.teamBProcess,
      };

      const presizedRoundData: MatchRoundNet = {
        nets,
        _id: round._id,
        match: body.match,
        matchCompleted,
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
