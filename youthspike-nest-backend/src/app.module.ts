import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AboutResolver } from './about/about.resolver';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { SharedModule } from './shared/shared.module';
import { TeamModule } from './team/team.module';
import { MatchModule } from './match/match.module';
import { RoundModule } from './round/round.module';
import { NetModule } from './net/net.module';
import { GatewayModule } from './gateway/gateway.module';
import { LdoModule } from './ldo/ldo.module';
import { PlayerModule } from './player/player.module';
import { SponsorModule } from './sponsor/sponsor.module';
import { RoomModule } from './room/room.module';
import { EmailsenderModule } from './emailsender/emailsender.module';
import { PlayerRankingModule } from './player-ranking/player-ranking.module';
import { GroupModule } from './group/group.module';
import { RedisModule } from './redis/redis.module';
import { EEnv, NODE_ENV } from './utils/keys';
import { PlayerStatsModule } from './player-stats/player-stats.module';
import { ServerReceiverOnNetModule } from './server-receiver-on-net/server-receiver-on-net.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GatewayModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      debug: NODE_ENV === EEnv.DEVELOPMENT,
      playground: false,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      persistedQueries: false, // 🔴 Disables persisted queries
      // persistedQueries: {
      //   cache: 'bounded',  // ✅ Enforce bounded cache to prevent memory exhaustion
      // },
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: async (config: ConfigService) => {
        return {
          uri: config.get<string>('DB_URI'),
        };
      },

      inject: [ConfigService],
    }),

    UserModule,

    EventModule,

    SharedModule,

    TeamModule,

    MatchModule,

    RoundModule,

    NetModule,

    LdoModule,

    PlayerModule,

    SponsorModule,

    RoomModule,

    EmailsenderModule,

    PlayerRankingModule,

    GroupModule,

    RedisModule,

    PlayerStatsModule,

    ServerReceiverOnNetModule,

  ],
  controllers: [AppController],
  providers: [AppService, AboutResolver],
})
export class AppModule { }
