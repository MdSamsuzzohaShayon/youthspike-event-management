import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { ROOM_PREFIX } from './gateway.types';
import { Server } from 'socket.io';

@Injectable()
export class GatewayRedisService {
  private readonly logger = new Logger(GatewayRedisService.name);
  private server: Server | null = null;

  constructor(private readonly redisService: RedisService) {}

  setServer(server: Server) {
    this.server = server;
    this.initializeRedisSubscriptions();
  }

  private initializeRedisSubscriptions() {
    if (!this.server) {
      this.logger.error('Socket.IO server not initialized');
      return;
    }

    const subClient = this.redisService.getSubClient();

    subClient.on('message', (channel: string, message: string) => {
      try {
        if (!this.server) {
          this.logger.warn('Received Redis message but server not available');
          return;
        }

        const { event, data, senderId } = JSON.parse(message);

        if (channel.startsWith(ROOM_PREFIX)) {
          const roomId = channel.replace(ROOM_PREFIX, '');
          this.server.to(roomId).except(senderId).emit(event, data);
          this.logger.debug(`Redis broadcast to ${roomId}: ${event}`);
        }
      } catch (error) {
        this.logger.error(`Error processing Redis message: ${error.message}`);
      }
    });

    subClient.on('error', (error) => {
      this.logger.error(`Redis SubClient error: ${error.message}`);
    });
  }

  async publishToRoom(roomId: string, event: string, data: any, senderId?: string) {
    const channel = `${ROOM_PREFIX}${roomId}`;
    const message = JSON.stringify({
      event,
      data,
      senderId,
    });

    const pubClient = await this.redisService.getPubClient();
    await pubClient.publish(channel, message);
  }

  async subscribeToRoom(roomId: string) {
    try {
      const subClient = this.redisService.getSubClient();
      await subClient.subscribe(`${ROOM_PREFIX}${roomId}`);
      this.logger.log(`Subscribed to Redis channel for room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to room ${roomId}: ${error.message}`);
    }
  }
}