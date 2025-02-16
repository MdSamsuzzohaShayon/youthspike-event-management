import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { MyGateway } from './gateway';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [SharedModule, RedisModule, ConfigModule.forRoot()],
  providers: [MyGateway],
})
export class GatewayModule {}
