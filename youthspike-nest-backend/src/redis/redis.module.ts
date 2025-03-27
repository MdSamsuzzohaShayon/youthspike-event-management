import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Module({
  providers: [RedisService], // ✅ Make RedisService available
  exports: [RedisService], // ✅ Allow other modules to use it
})
export class RedisModule {}
