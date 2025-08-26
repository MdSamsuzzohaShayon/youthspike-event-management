import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Gateway } from './gateway';
import { GatewayService } from './gateway.service';
import { GatewayRedisService } from './gateway.redis';
import { RoomHelper } from './gateway.helpers/room.helper';
import { ClientHelper } from './gateway.helpers/client.helper';
import { ValidationHelper } from './gateway.helpers/validation.helper';
import { RedisHelper } from './gateway.helpers/redis.helper';
import { ScoreKeeperHelper } from './gateway.helpers/score-keeper.helper';
import { PointsUpdateHelper } from './gateway.helpers/points-update.helper';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    SharedModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],

      useFactory: async (config: ConfigService) => {
        return {
          secret: config.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '1d',
          },
        };
      },

      inject: [ConfigService],
    }),
    ConfigModule.forRoot(),
  ],

  providers: [
    Gateway,
    GatewayService,
    GatewayRedisService,
    RoomHelper,
    ClientHelper,
    ValidationHelper,
    RedisHelper,
    ScoreKeeperHelper,
    PointsUpdateHelper,
  ],
})
export class GatewayModule {}
