import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from 'src/redis/redis.module';
import { Gateway } from './gateway';

@Module({
  imports: [SharedModule, RedisModule, ConfigModule.forRoot()],
  providers: [Gateway],
})
export class GatewayModule {}
