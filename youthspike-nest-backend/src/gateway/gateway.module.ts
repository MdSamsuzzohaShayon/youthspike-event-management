import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { Gateway } from './gateway';
import { GatewayService } from './gateway.service';
import { GatewayRedisService } from './gateway.redis';
import { RoomHelper } from './gateway.helpers/room.helper';
import { ClientHelper } from './gateway.helpers/client.helper';
import { ValidationHelper } from './gateway.helpers/validation.helper';
import { RedisHelper } from './gateway.helpers/redis.helper';
import { ScoreKeeperHelper } from './gateway.helpers/score-keeper.helper';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],
  providers: [
    Gateway,
    GatewayService,
    GatewayRedisService,
    RoomHelper,
    ClientHelper,
    ValidationHelper,
    RedisHelper,
    ScoreKeeperHelper,
  ],
})
export class GatewayModule {}