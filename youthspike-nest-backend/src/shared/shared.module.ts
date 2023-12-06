import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchemaFactory } from 'src/event/event.schema';
import { Match, MatchSchemaFactory } from 'src/match/match.schema';
import { Net, NetSchemaFactory } from 'src/net/net.schema';
import { Round, RoundSchemaFactory } from 'src/round/round.schema';
import { Sub, SubSchemaFactory } from 'src/sub/sub.schema';
import { Team, TeamSchemaFactory } from 'src/team/team.schema';
import { User, UserRole, UserSchemaFactory } from 'src/user/user.schema';
import { JwtAuthGuard } from './auth/jwt.guard';
import { JwtStrategy } from './auth/jwt.strategy';
import { UserService } from 'src/user/user.service';
import { DateScalar } from './date-scaler';
import { EventService } from 'src/event/event.service';
import { MatchService } from 'src/match/match.service';
import { LdoService } from 'src/ldo/ldo.service';
import { LDO, LDOSchemaFactory } from 'src/ldo/ldo.schema';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/team/team.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { SubService } from './services/sub.service';
import { CloudinaryService } from './services/cloudinary.service';
import { Player, PlayerSchemaFactory } from 'src/player/player.schema';

@Module({
  imports: [
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

    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: UserSchemaFactory,
      },
      {
        name: Team.name,
        useFactory: TeamSchemaFactory,
      },
      {
        name: Event.name,
        useFactory: EventSchemaFactory,
      },
      {
        name: Match.name,
        useFactory: MatchSchemaFactory,
      },
      {
        name: Round.name,
        useFactory: RoundSchemaFactory,
      },
      {
        name: Net.name,
        useFactory: NetSchemaFactory,
      },
      {
        name: Sub.name,
        useFactory: SubSchemaFactory,
      },
      {
        name: Player.name,
        useFactory: PlayerSchemaFactory,
      },
      {
        name: LDO.name,
        useFactory: LDOSchemaFactory,
      },
    ]),

    ConfigModule,
  ],

  providers: [
    DateScalar,
    CloudinaryService,
    UserService,
    JwtStrategy,
    JwtAuthGuard,
    PlayerService,
    TeamService,
    EventService,
    MatchService,
    RoundService,
    NetService,
    PlayerService,
    LdoService,
    SubService,
    // { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [
    CloudinaryService,
    UserService,
    PlayerService,
    TeamService,

    EventService,
    MatchService,
    RoundService,
    NetService,
    PlayerService,
    LdoService,
    SubService,
  ],
})
export class SharedModule {
  constructor(private modRef: ModuleRef, private configService: ConfigService) {}

  async onApplicationBootstrap() {
    try {
      const userService = this.modRef.get(UserService);
      await userService.createOrUpdateAdmin({
        firstName: this.configService.get<string>('ADMIN_FIRST_NAME'),
        lastName: this.configService.get<string>('ADMIN_LAST_NAME'),
        role: UserRole.admin,
        active: true,
        login: {
          email: this.configService.get<string>('ADMIN_EMAIL'),
          password: this.configService.get<string>('ADMIN_PASSWORD'),
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
