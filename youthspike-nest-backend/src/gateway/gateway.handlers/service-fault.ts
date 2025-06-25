import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ETeam, RoomLocal, ServiceFaultInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ValidationHelper } from '../gateway.helpers/validation.helper';
import { UserRole } from 'src/user/user.schema';
import { EActionProcess } from 'src/round/round.schema';

export class ServiceFaultHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() serviceFault: ServiceFaultInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
        console.log(serviceFault);
        

    /**
     * Get a match
     */
    //   const prevRoom = roomsLocal.get(serviceFault.room);
    //   if (!prevRoom) throw new Error('Room not found, Incorrect room ID!');

    //   const roomData = { ...prevRoom };
    //   const roundList = [...roomData.rounds];
    //   const roundI = roundList.findIndex((r) => r._id === serviceFault.round);

    //   if (roundI === -1) throw new Error('Round not found with that round ID!');


    //   await Promise.all([
    //     this.gatewayRedisService.publishToRoom(serviceFault.room, 'check-in-response-to-all', roomData, client.id),
    //     this.gatewayRedisService.publishToRoom(serviceFault.room, 'round-update-all-pages', presizedRoundData, client.id),
    //   ]);
    } catch (error) {
      await this.gatewayRedisService.publishToSocket(
        client.id,
        'error-from-server',
        error?.message || 'Internal error occured',
      );
    }
  }
}