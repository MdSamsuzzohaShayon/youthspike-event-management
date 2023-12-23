import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AboutResolver } from './about/about.resolver';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { SharedModule } from './shared/shared.module';
import { TeamModule } from './team/team.module';
import { MatchModule } from './match/match.module';
import { RoundModule } from './round/round.module';
import { NetModule } from './net/net.module';
import { GatewayModule } from './getway/getway.module';
import { LdoModule } from './ldo/ldo.module';
import { PlayerModule } from './player/player.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GatewayModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      debug: true,
      playground: false,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
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

  ],
  controllers: [AppController],
  providers: [AppService, AboutResolver],
})
export class AppModule { }
