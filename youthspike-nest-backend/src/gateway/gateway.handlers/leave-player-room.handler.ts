import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JoinPlayerRoomInput } from '../gateway.types';

export class LeavePlayerRoomHandler {
  constructor() {}

  async handle(@ConnectedSocket() client: Socket, @MessageBody() leaveData: JoinPlayerRoomInput) {
    if (!leaveData.playerId) {
      client.emit('error-from-server', 'Player ID is required');
      return;
    }

    await client.leave(leaveData.playerId); // leave Redis-backed room
    console.log(`Leave player(${leaveData.playerId}) from the room client ID: ${client.id}`);
    
  }
}

/*
Where Redis comes in
    Socket.IO has an official Redis adapter: @socket.io/redis-adapter.
    This adapter internally uses Redis pub/sub to sync rooms and events.
    You don’t need to manually subscribeToSocket or publishToSocket — the adapter does that for you.

*/
