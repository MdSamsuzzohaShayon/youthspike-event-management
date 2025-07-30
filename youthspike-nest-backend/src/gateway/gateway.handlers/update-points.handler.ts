import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UpdatePointsInput, RoomLocal } from '../gateway.types';
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

      const { roundService } = this.pointsHelper['gatewayService'].getServices();
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
      await this.pointsHelper.updateNetScores(updatePointsInput.nets);

      // Calculate round scores
      const { teamAScore, teamBScore } = await this.pointsHelper.calculateRoundScores(updatePointsInput.round);
      const completed = !!(teamAScore && teamAScore > 0 && teamBScore && teamBScore > 0);

      // Update round with new scores
      await roundService.updateOne(
        { _id: updatePointsInput.round }, 
        { teamAScore, teamBScore, completed }
      );

      // Build  response
      const pointsResponse = await this.pointsHelper.buildPointsResponse(
        updatePointsInput,
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
        updatePointsInput.nets,
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