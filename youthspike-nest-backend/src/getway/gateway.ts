import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({ cors: true, namespace: 'websocket' })
export class MyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger: Logger = new Logger('MyGateway');

  constructor(private readonly redisService: RedisService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: { room: string; message: string }, @ConnectedSocket() client: Socket) {
    const { room, message } = data;
    
    // Use Redis Pub/Sub
    const pubClient = this.redisService.getPubClient();
    await pubClient.publish(room, JSON.stringify({ user: client.id, message }));

    client.to(room).emit('message', { user: client.id, message });
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
    client.emit('join-room-response', `Joined room: ${room}`);

    // Subscribe to Redis channel
    const subClient = this.redisService.getSubClient();
    await subClient.subscribe(room);
  }
}
