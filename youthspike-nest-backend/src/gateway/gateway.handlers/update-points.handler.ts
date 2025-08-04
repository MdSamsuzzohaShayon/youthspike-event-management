import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UpdatePointsInput, RoomLocal, NetScore } from '../gateway.types';
import { GatewayRedisService } from '../gateway.redis';
import { PointsUpdateHelper } from '../gateway.helpers/points-update.helper';
import { GatewayService } from '../gateway.service';

export class UpdatePointsHandler {
  constructor(
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly pointsHelper: PointsUpdateHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() updatePointsInput: UpdatePointsInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      const prevRoom = roomsLocal.get(updatePointsInput.room);
      if (!prevRoom) throw new Error('Room not found, Incorrect room ID!');

      const { roundService, netService } = this.pointsHelper['gatewayService'].getServices();
      const [roundList, roundExist] = await Promise.all([
        roundService.find({ match: prevRoom.match }),
        roundService.findById(updatePointsInput.round),
      ]);

      if (!roundList || !roundExist) {
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
      const nets: NetScore[] = netList.map((n) => ({ _id: n._id, teamAScore: n.teamAScore, teamBScore: n.teamBScore }));

      // Build  response
      const pointsResponse = await this.pointsHelper.buildPointsResponse(
        nets,
        updatePointsInput.round,
        updatePointsInput.room,
        prevRoom.match,
        teamAScore,
        teamBScore,
        completed,
        roundList.length,
      );

      // Publish response
      await this.pointsHelper.publishUpdates(
        updatePointsInput.room,
        prevRoom.match,
        pointsResponse,
        nets,
        updatePointsInput.round,
      );
    } catch (error) {
      await this.gatewayRedisService.publishToSocket(
        client.id,
        'error-from-server',
        error?.message || 'Internal error occurred',
      );
    }
  }
}
