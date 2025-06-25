import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ServerReceiverOnNet, RoomLocal } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';

export class ServerReceiverHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    // @MessageBody() serverReceiverInput: SetServerReceiverInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      console.log("Working");
      
    } catch (error) {
      await this.gatewayRedisService.publishToSocket(
        client.id,
        'error-from-server',
        error?.message || 'Internal error occured',
      );
    }
  }
}
