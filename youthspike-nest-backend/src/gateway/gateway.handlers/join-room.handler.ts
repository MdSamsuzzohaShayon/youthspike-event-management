import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { GeneralClient, JoinRoomInput, RoomLocal } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { RoomHelper } from '../gateway.helpers/room.helper';
import { ClientHelper } from '../gateway.helpers/client.helper';

export class JoinRoomHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly roomHelper: RoomHelper,
    private readonly clientHelper: ClientHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() joinData: JoinRoomInput,
    roomsLocal: Map<string, RoomLocal>,
    clientList: Map<string, GeneralClient>,
  ) {
    try {
      if (!joinData.match) throw new Error('Match ID is required');

      const { roomService, roundService } = this.gatewayService.getServices();
      const [roomExist, roundExist, roundsOfTheMatch] = await Promise.all([
        roomService.findOne({ match: joinData.match }),
        roundService.findById(joinData.round),
        roundService.find({ match: joinData.match }),
      ]);

      if (!roomExist || !roundExist || !roundsOfTheMatch?.length) {
        throw new Error('Room or round not found');
      }

      const roomId = roomExist._id.toString();
      if (joinData.userId) await client.join(roomId);

      let roomData = roomsLocal.get(roomId) || this.roomHelper.createInitialRoomData(roomExist, roundsOfTheMatch);

      if (joinData.team) {
        roomData = this.roomHelper.updateTeamAssignment(
          roomData,
          joinData.team,
          roomExist.teamA.toString(),
          roomExist.teamB.toString(),
          client.id,
        );
      }

      this.clientHelper.updateClientData(clientList, client.id, {
        userId: joinData.userId,
        matchId: joinData.match,
        userRole: joinData.userRole,
      });

      roomsLocal.set(roomId, roomData);
      await this.gatewayRedisService.publishToRoom(roomId, 'join-room-response-all', roomData, client.id);
      await this.gatewayRedisService.subscribeToRoom(roomId);

      return { success: true, roomId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}