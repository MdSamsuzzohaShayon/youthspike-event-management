import { Injectable } from '@nestjs/common';
import { GatewayRedisService } from '../gateway.redis';

@Injectable()
export class RedisHelper {
  constructor(private readonly gatewayRedisService: GatewayRedisService) {}

  async subscribeToRoom(roomId: string) {
    await this.gatewayRedisService.subscribeToRoom(roomId);
  }
}