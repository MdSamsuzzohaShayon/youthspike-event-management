import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UpdatePointsInput, RoomLocal, NetScore } from '../gateway.types';
import { PointsUpdateHelper } from '../gateway.helpers/points-update.helper';
import { GatewayService } from '../gateway.service';
import { ETieBreakingStrategy } from 'src/event/event.schema';

export class UpdatePointsHandler {
  constructor(private readonly gatewayService: GatewayService, private readonly pointsHelper: PointsUpdateHelper) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() updatePointsInput: UpdatePointsInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      const prevRoom = roomsLocal.get(updatePointsInput.room);
      if (!prevRoom) throw new Error('Room not found, Incorrect room ID!');

      // const { roundService, netService } = this.pointsHelper['gatewayService'].getServices();
      const { roundService, netService, matchService } = this.gatewayService.getServices();
      const [roundList, roundExist, matchExist] = await Promise.all([
        roundService.find({ match: prevRoom.match }),
        roundService.findById(updatePointsInput.round),
        matchService.findOne({ _id: prevRoom.match }),
      ]);

      if (!roundList || !roundExist || !matchExist) {
        throw new Error(
          `Round data not found! Round List: ${JSON.stringify(roundList)}, Round Exist: ${JSON.stringify(roundExist)}`,
        );
      }

      // Update net scores
      await netService.updateOne(
        { _id: updatePointsInput.net._id },
        { $set: { teamAScore: updatePointsInput.net.teamAScore, teamBScore: updatePointsInput.net.teamBScore } },
      );

      // Calculate round scores
      const { teamAScore, teamBScore } = await this.pointsHelper.calculateRoundScores(updatePointsInput.round);
      const completed = !!(teamAScore && teamAScore > 0 && teamBScore && teamBScore > 0);

      // Update round with new scores
      await roundService.updateOne({ _id: updatePointsInput.round }, { teamAScore, teamBScore, completed });

      // Find all nets and then update
      const netList = await netService.find({ round: updatePointsInput.round });
      // const nets: NetScore[] = netList.map((n) => ({ _id: n._id, teamAScore: n.teamAScore, teamBScore: n.teamBScore }));
      const nets: NetScore[] = [];

      let matchCompleted = completed;
      if (completed) {
        // check check all nets are completed or not
        for (let i = 0; i < netList.length; i += 1) {
          const net = netList[i];
          nets.push({ _id: net._id, teamAScore: net.teamAScore, teamBScore: net.teamBScore });
          // Check both team has score, even 0 are allowed
          if (
            net.teamAScore === null ||
            net.teamAScore === undefined ||
            typeof net.teamAScore !== 'number' ||
            isNaN(net.teamAScore)
          ) {
            matchCompleted = false;
            break;
          }
          if (
            net.teamBScore === null ||
            net.teamBScore === undefined ||
            typeof net.teamBScore !== 'number' ||
            isNaN(net.teamBScore)
          ) {
            matchCompleted = false;
            break;
          }
        }

        // Check team A scores and team B scores are same or not
        if (matchCompleted) {
          const allNets = await netService.find({ match: prevRoom.match });

          let teamAScore = 0,
            teamBScore = 0;
          for (let i = 0; i < allNets.length; i += 1) {
            const net = allNets[i];
            if (net.teamAScore > net.teamBScore) {
              teamAScore += net.points;
            } else if (net.teamBScore > net.teamAScore) {
              teamBScore += net.points;
            }
          }
          if (teamAScore === teamBScore) {
            // Check if it is overtime round or not
            if (matchExist.tieBreaking === ETieBreakingStrategy.OVERTIME_ROUND && !matchExist.extendedOvertime) {
              matchCompleted = false;
            }
          }
        }
      }
      await matchService.updateOne({ _id: prevRoom.match }, { $set: { completed: matchCompleted } });

      // Build  response
      const pointsResponse = {
        nets: nets,
        room: prevRoom._id,
        round: { _id: roundExist._id, teamAScore, teamBScore, completed },
        matchCompleted,
        teamAProcess: roundExist.teamAProcess,
        teamBProcess: roundExist.teamBProcess,
      };

      // Publish response
      await this.pointsHelper.publishUpdates(
        updatePointsInput.room,
        prevRoom.match,
        pointsResponse,
        nets,
        updatePointsInput.round,
      );
    } catch (error) {
      await this.pointsHelper.publishError(client.id, error?.message || 'Internal error occurred');
    }
  }
}
