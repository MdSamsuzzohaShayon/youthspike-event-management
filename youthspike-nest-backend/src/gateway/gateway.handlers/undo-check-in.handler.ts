import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { CheckInInput, ETeam, RoomLocal } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ValidationHelper } from '../gateway.helpers/validation.helper';
import { UserRole } from 'src/user/user.schema';
import { EActionProcess } from 'src/round/round.schema';

export class UndoCheckInHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly validationHelper: ValidationHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() undoCheckIn: CheckInInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      const prevRoom = roomsLocal.get(undoCheckIn.room);
      if (!prevRoom) throw new Error('Room not found, Incorrect room ID!');

      const roomData = { ...prevRoom };
      const roundList = [...roomData.rounds];
      const roundI = roundList.findIndex((r) => r._id === undoCheckIn.round);

      if (roundI === -1) throw new Error('Round not found with that round ID!');

      if (undoCheckIn.userRole === UserRole.captain || undoCheckIn.userRole === UserRole.co_captain) {
        await this.validationHelper.validateCaptainCheckIn(undoCheckIn.userId);
      }

      const currRoundObj = { ...roundList[roundI] };
      if (undoCheckIn.teamE === ETeam.teamA) {
        currRoundObj.teamAProcess = EActionProcess.INITIATE;
      } else {
        currRoundObj.teamBProcess = EActionProcess.INITIATE;
      }

      const updateRoundData = {
        teamAProcess: currRoundObj.teamAProcess,
        teamBProcess: currRoundObj.teamBProcess,
      };

      await this.gatewayService.getServices().roundService.updateOne({ _id: undoCheckIn.round }, updateRoundData);

      roundList[roundI] = currRoundObj;
      roomData.rounds = roundList;
      roomsLocal.set(undoCheckIn.room, roomData);

      const presizedRoundData = {
        ...updateRoundData,
        _id: undoCheckIn.round,
        match: prevRoom.match,
      };

      await Promise.all([
        this.gatewayRedisService.publishToRoom(undoCheckIn.room, 'undo-check-in-response-to-all', roomData, client.id),
        this.gatewayRedisService.publishToRoom(undoCheckIn.room, 'undo-round-update-all-pages', presizedRoundData, client.id),
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
