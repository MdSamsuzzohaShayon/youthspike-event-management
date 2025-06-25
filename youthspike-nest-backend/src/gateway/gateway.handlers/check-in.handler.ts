import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { CheckInInput, ETeam, RoomLocal } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ValidationHelper } from '../gateway.helpers/validation.helper';
import { UserRole } from 'src/user/user.schema';
import { EActionProcess } from 'src/round/round.schema';

export class CheckInHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly validationHelper: ValidationHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() checkIn: CheckInInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      const prevRoom = roomsLocal.get(checkIn.room);
      if (!prevRoom) throw new Error('Room not found, Incorrect room ID!');

      const roomData = { ...prevRoom };
      const roundList = [...roomData.rounds];
      const roundI = roundList.findIndex((r) => r._id === checkIn.round);

      if (roundI === -1) throw new Error('Round not found with that round ID!');

      if (checkIn.userRole === UserRole.captain || checkIn.userRole === UserRole.co_captain) {
        await this.validationHelper.validateCaptainCheckIn(checkIn.userId);
      }

      const currRoundObj = { ...roundList[roundI] };
      if (checkIn.teamE === ETeam.teamA) {
        currRoundObj.teamAProcess = EActionProcess.CHECKIN;
      } else {
        currRoundObj.teamBProcess = EActionProcess.CHECKIN;
      }

      const updateRoundData = {
        teamAProcess: currRoundObj.teamAProcess,
        teamBProcess: currRoundObj.teamBProcess,
      };

      await this.gatewayService.getServices().roundService.updateOne({ _id: checkIn.round }, updateRoundData);

      roundList[roundI] = currRoundObj;
      roomData.rounds = roundList;
      roomsLocal.set(checkIn.room, roomData);

      const presizedRoundData = {
        ...updateRoundData,
        _id: checkIn.round,
        match: prevRoom.match,
      };

      await Promise.all([
        this.gatewayRedisService.publishToRoom(checkIn.room, 'check-in-response-to-all', roomData, client.id),
        this.gatewayRedisService.publishToRoom(checkIn.room, 'round-update-all-pages', presizedRoundData, client.id),
      ]);
    } catch (error) {
      await this.gatewayRedisService.publishToSocket(
        client.id,
        'error-from-server',
        error?.message || 'Internal error occured',
      );
    }
  }
}
