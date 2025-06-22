import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UpdatePointsInput, RoundUpdatedResponse, MatchRoundNet, RoomLocal } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';

export class UpdatePointsHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() updatePointsInput: UpdatePointsInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      const prevRoom = roomsLocal.get(updatePointsInput.room);
      if (!prevRoom) throw new Error('Room not found, Incorrect room ID!');

      const { roundService, netService, matchService } = this.gatewayService.getServices();
      const [roundList, roundExist] = await Promise.all([
        roundService.find({ match: prevRoom.match }),
        roundService.findById(updatePointsInput.round),
      ]);

      if (!roundList || !roundExist) {
        throw new Error(
          `Round List or Round Exist not found! Round List: ${JSON.stringify(roundList)}, Round Exist: ${JSON.stringify(
            roundExist,
          )}`,
        );
      }

      const updatePromises = [];
      for (const n of updatePointsInput.nets) {
        const pointsObj: any = {};
        if (n.teamAScore || n.teamAScore === 0) pointsObj.teamAScore = n.teamAScore;
        if (n.teamBScore || n.teamBScore === 0) pointsObj.teamBScore = n.teamBScore;
        updatePromises.push(netService.updateOne({ _id: n._id }, pointsObj));
      }
      await Promise.all(updatePromises);

      const findNets = await netService.find({ round: updatePointsInput.round });
      let teamAScore = null;
      let teamBScore = null;
      let i = 0;
      while (i < findNets.length) {
        if (findNets[i].teamAScore && findNets[i].teamBScore) {
          teamAScore ? (teamAScore += findNets[i].teamAScore) : (teamAScore = findNets[i].teamAScore);
          teamBScore ? (teamBScore += findNets[i].teamBScore) : (teamBScore = findNets[i].teamBScore);
        } else {
          teamAScore = null;
          teamBScore = null;
        }
        i += 1;
      }

      let completed = false;
      if (teamAScore && teamAScore > 0 && teamBScore && teamBScore > 0) completed = true;
      await roundService.updateOne({ _id: updatePointsInput.round }, { teamAScore, teamBScore, completed });

      const pointsResponse: RoundUpdatedResponse = {
        nets: updatePointsInput.nets,
        room: updatePointsInput.room,
        round: { _id: updatePointsInput.round, teamAScore, teamBScore, completed },
        matchCompleted: false,
        teamAProcess: roundExist.teamAProcess,
        teamBProcess: roundExist.teamBProcess,
      };

      if (completed && roundExist.num === roundList.length) {
        await matchService.updateOne({ _id: prevRoom.match }, { completed });
        pointsResponse.matchCompleted = true;
      }

      // client.to(prevRoom._id).emit('update-points-response', pointsResponse);
      const presizedRoundData: MatchRoundNet = {
        nets: updatePointsInput.nets,
        _id: updatePointsInput.round,
        match: prevRoom.match,
        matchCompleted: pointsResponse.matchCompleted,
      };

      await Promise.all([
        this.gatewayRedisService.publishToRoom(
          updatePointsInput.room,
          'update-points-response',
          pointsResponse,
        ),
        this.gatewayRedisService.publishToRoom(
          updatePointsInput.room,
          'update-points-response-all',
          pointsResponse,
        ),
        this.gatewayRedisService.publishToRoom(
          updatePointsInput.room,
          'net-update-all-pages',
          presizedRoundData,
        ),
      ]);
    } catch (error) {
      await this.gatewayRedisService.publishToRoom(
        updatePointsInput.room,
        'error-from-server',
        error?.message || 'Internal error occured',
      );
    }
  }
}