import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { GeneralClient, JoinRoomInput, RoomLocal } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { RoomHelper } from '../gateway.helpers/room.helper';
import { ClientHelper } from '../gateway.helpers/client.helper';
import { NetService } from 'src/net/net.service';

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

      const { roomService, roundService, netService } = this.gatewayService.getServices();
      const [roomExist, roundExist, roundsOfTheMatch] = await Promise.all([
        roomService.findOne({ match: joinData.match }),
        roundService.findById(joinData.round),
        roundService.find({ match: joinData.match }),
      ]);

      if (!roomExist || !roundExist || !roundsOfTheMatch?.length) {
        throw new Error('Room or round not found');
      }

      const roomId = roomExist._id.toString();
      // if (joinData.userId) await client.join(roomId);
      await client.join(roomId);

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

      // Redis score keeping
      /*
      const netServerReceiverPromises = [];
      const netList = await netService.find({match: joinData.match});
      for (let i = 0; i < netList.length; i++) {
        const CACHE_KEY = `action:${netList[i]._id}:${roomId}`;
        netServerReceiverPromises.push(this.gatewayRedisService.getAction(CACHE_KEY))
      }
      const netServerReceivers = await Promise.all(netServerReceiverPromises);

      const roomDataWithServerReceivers = {
        ...roomData,
        netsServerReceiver: netServerReceivers // For score keeper
      }
      */

      await this.gatewayRedisService.publishToRoom(roomId, 'join-room-response-all', roomData, client.id);
      
      
      // Get all updates of the room
      await this.gatewayRedisService.subscribeToRoom(roomId);
      await this.gatewayRedisService.subscribeToSocket(client.id);

      return { success: true, roomId };
    } catch (error) {
      await this.gatewayRedisService.publishToSocket(
        client.id,
        'error-from-server',
        error?.message || 'Internal error occured',
      );
    }
  }
}
