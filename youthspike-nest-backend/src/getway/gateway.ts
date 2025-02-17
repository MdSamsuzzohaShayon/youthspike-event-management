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

  constructor(private readonly redisService: RedisService) { }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: { room: string; message: string }, @ConnectedSocket() client: Socket) {
    const { room, message } = data;

    // Log Redis cluster nodes
    this.logger.log(
      `Publishing message on cluster nodes: ${this.redisService
        .getPubClient()
        .nodes('master')
        .map((node) => node.options.port)}`,
    );

    // Use Redis Pub/Sub
    const pubClient = this.redisService.getPubClient();
    await pubClient.publish(room, JSON.stringify({ user: client.id, message }));

    client.to(room).emit('message', { user: client.id, message });
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
    client.emit('join-room-response', `Joined room: ${room}`);

    // Log Redis cluster nodes

    console.log(
      `Subscribing to room "${room}" on cluster nodes: ${this.redisService
        .getSubClient()
        .nodes('master')
        .map((node) => node.options.port)}`
    );

    // Subscribe to Redis channel
    const subClient = this.redisService.getSubClient();
    if (!subClient) {
      console.error('🚨 Redis SubClient is undefined!');
    } else {
      console.log(`✅ Redis SubClient is initialized.`);
    }
    
    try {
      await subClient.subscribe(room);
      console.log(`✅ Successfully subscribed to room "${room}"`);
    } catch (err) {
      console.error(`❌ Failed to subscribe to room "${room}": ${err.message}`);
    }
  }
}
