import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UpdatePointsInput, RoomLocal, NetScore, MatchRoundNet } from '../gateway.types';
import { PointsUpdateHelper } from '../gateway.helpers/points-update.helper';
import { GatewayService } from '../gateway.service';
import { ETieBreakingStrategy } from 'src/event/event.schema';
import { GatewayRedisService } from '../gateway.redis';

export class UpdatePointsHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly pointsHelper: PointsUpdateHelper,
  ) {}

  /**
   * Handle incoming "update points" event from a client socket.
   * - Validates room and round existence
   * - Updates the net document with incoming scores
   * - Recalculates round totals via PointsUpdateHelper
   * - Determines if the match is completed (including tie-breaking/overtime logic)
   * - Publishes updates to Redis channels
   */
  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() updatePointsInput: UpdatePointsInput,
    roomsLocal: Map<string, RoomLocal>,
  ): Promise<void> {
    try {
      const room = roomsLocal.get(updatePointsInput.room);
      if (!room) {
        throw new Error('Room not found — incorrect room ID');
      }

      // get dependent services once
      const { roundService, netService, matchService } = this.gatewayService.getServices();

      // fetch required data in parallel
      const [roundList, roundDoc, matchDoc] = await Promise.all([
        roundService.find({ match: room.match }),
        roundService.findById(updatePointsInput.round),
        matchService.findOne({ _id: room.match }),
      ]);

      if (!roundList || !roundDoc || !matchDoc) {
        throw new Error(
          `Round/match data missing. roundList: ${!!roundList}, roundDoc: ${!!roundDoc}, matchDoc: ${!!matchDoc}`,
        );
      }

      // Update the specific net with new scores
      await netService.updateOne(
        { _id: updatePointsInput.net._id },
        {
          $set: {
            teamAScore: updatePointsInput.net.teamAScore,
            teamBScore: updatePointsInput.net.teamBScore,
          },
        },
      );

      // Recalculate round totals using helper (expects { teamAScore, teamBScore } return)
      const { teamAScore: roundTeamAScore, teamBScore: roundTeamBScore } =
        await this.pointsHelper.calculateRoundScores(updatePointsInput.round);

      // A round is 'completed' if both teams have numeric scores (0 allowed)
      const isRoundCompleted = this.isNumericScore(roundTeamAScore) && this.isNumericScore(roundTeamBScore);

      // Persist round totals
      await roundService.updateOne(
        { _id: updatePointsInput.round },
        { teamAScore: roundTeamAScore, teamBScore: roundTeamBScore, completed: isRoundCompleted },
      );

      // Get nets for the round and prepare a lightweight list to publish
      const roundNetDocs = await netService.find({ round: updatePointsInput.round });
      const roundNets: NetScore[] = roundNetDocs.map((n) => ({
        _id: n._id,
        teamAScore: n.teamAScore,
        teamBScore: n.teamBScore,
      }));

      // Determine if match is completed. Start optimistic, then disqualify if any net is invalid.
      let isMatchCompleted = isRoundCompleted;

      // Only run full match-completion checks when this round is the final round expected
      if (isMatchCompleted && roundDoc.num === roundList.length) {
        // ensure every net in this round has defined numeric scores
        for (const net of roundNetDocs) {
          if (!this.isNumericScore(net.teamAScore) || !this.isNumericScore(net.teamBScore)) {
            isMatchCompleted = false;
            break;
          }
        }

        // If still possibly completed, compute match-level points and apply tie-breaking rules
        if (isMatchCompleted) {
          const allMatchNets = await netService.find({ match: room.match });

          // Sum points won by teams across all nets
          let matchTeamAPoints = 0;
          let matchTeamBPoints = 0;
          for (const net of allMatchNets) {
            if (net.teamAScore > net.teamBScore) {
              matchTeamAPoints += net.points ?? 0;
            } else if (net.teamBScore > net.teamAScore) {
              matchTeamBPoints += net.points ?? 0;
            }
          }

          // If tied and match uses OVERTIME_ROUND but overtime not yet started — not completed
          if (matchTeamAPoints === matchTeamBPoints) {
            if (matchDoc.tieBreaking === ETieBreakingStrategy.OVERTIME_ROUND && !matchDoc.extendedOvertime) {
              isMatchCompleted = false;
            }
          }
        }
      } else {
        // Not the final round => match is not completed yet
        isMatchCompleted = false;
      }

      // Persist match completion state
      await matchService.updateOne({ _id: room.match }, { $set: { completed: isMatchCompleted } });

      // Build the responses to publish
      const pointsResponse = {
        nets: roundNets,
        room: room._id,
        round: { _id: roundDoc._id, teamAScore: roundTeamAScore, teamBScore: roundTeamBScore, completed: isRoundCompleted },
        matchCompleted: isMatchCompleted,
        teamAProcess: roundDoc.teamAProcess,
        teamBProcess: roundDoc.teamBProcess,
      };

      const presizedRoundData: MatchRoundNet = {
        nets: roundNets,
        _id: updatePointsInput.round,
        match: room.match,
        matchCompleted: isMatchCompleted,
      };

      // Publish both messages in parallel
      await Promise.all([
        this.gatewayRedisService.publishToRoom(room._id, 'update-points-response-all', pointsResponse),
        this.gatewayRedisService.publishToRoom(room._id, 'net-update-all-pages', presizedRoundData),
      ]);
    } catch (err: any) {
      // ensure we publish a useful error to the client
      await this.pointsHelper.publishError((client && client.id) || 'unknown-client', err?.message ?? 'Internal error occurred');
    }
  }

  /**
   * Helper: returns true for numbers (including 0) and false for null/undefined/NaN/non-number
   */
  private isNumericScore(value: unknown): value is number {
    return typeof value === 'number' && !Number.isNaN(value);
  }
}
