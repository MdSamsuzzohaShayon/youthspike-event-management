import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JoinPlayerRoomInput } from '../gateway.types';

export class JoinPlayerRoomHandler {
  constructor() {}

  async handle(@ConnectedSocket() client: Socket, @MessageBody() joinData: JoinPlayerRoomInput) {
    if (!joinData.playerId) {
      client.emit('error-from-server', 'Player ID is required');
      return;
    }

    await client.join(joinData.playerId); // join Redis-backed room
    client.emit('join-room-from-server', { success: true, playerId: joinData.playerId });
    console.log(`Join player(${joinData.playerId}) from the room client ID: ${client.id}`);
  }
}

/*
Where Redis comes in
    Socket.IO has an official Redis adapter: @socket.io/redis-adapter.
    This adapter internally uses Redis pub/sub to sync rooms and events.
    You don’t need to manually subscribeToSocket or publishToSocket — the adapter does that for you.

*/
