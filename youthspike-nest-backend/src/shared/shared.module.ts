import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Event, EventSchemaFactory } from 'src/event/event.schema';
import { Match, MatchSchemaFactory } from 'src/match/match.schema';
import { Net, NetSchemaFactory } from 'src/net/net.schema';
import { Round, RoundSchemaFactory } from 'src/round/round.schema';
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
import { CloudinaryService } from './services/cloudinary.service';
import { Player, PlayerSchemaFactory } from 'src/player/player.schema';
import { SponsorService } from 'src/sponsor/sponsor.service';
import { Sponsor, SponsorSchemaFactory } from 'src/sponsor/sponsor.schema';
import { Room, RoomSchemaFactory } from 'src/room/room.schema';
import { RoomService } from 'src/room/room.service';
import { EmailsenderService } from 'src/emailsender/emailsender.service';
import {
  PlayerRanking,
  PlayerRankingItem,
  PlayerRankingItemSchemaFactory,
  PlayerRankingSchemaFactory,
} from 'src/player-ranking/player-ranking.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';

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
        name: Player.name,
        useFactory: PlayerSchemaFactory,
      },
      {
        name: LDO.name,
        useFactory: LDOSchemaFactory,
      },
      {
        name: Sponsor.name,
        useFactory: SponsorSchemaFactory,
      },
      {
        name: Room.name,
        useFactory: RoomSchemaFactory,
      },

      {
        name: PlayerRanking.name,
        useFactory: PlayerRankingSchemaFactory,
      },
      {
        name: PlayerRankingItem.name,
        useFactory: PlayerRankingItemSchemaFactory,
      }
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
    SponsorService,
    // { provide: APP_GUARD, useClass: RolesGuard },
    RoomService,
    EmailsenderService,
    PlayerRankingService,
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
    SponsorService,
    RoomService,
    EmailsenderService,
    PlayerRankingService,
  ],
})
export class SharedModule {
  constructor(private modRef: ModuleRef, private configService: ConfigService) {}

  async onApplicationBootstrap() {
    try {
      const userService = this.modRef.get(UserService);
      const hashedPassword = await bcrypt.hash(this.configService.get<string>('ADMIN_PASSWORD'), 10);
      await userService.createOrUpdateAdmin({
        firstName: this.configService.get<string>('ADMIN_FIRST_NAME'),
        lastName: this.configService.get<string>('ADMIN_LAST_NAME'),
        role: UserRole.admin,
        active: true,
        email: this.configService.get<string>('ADMIN_EMAIL'),
        password: hashedPassword,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
