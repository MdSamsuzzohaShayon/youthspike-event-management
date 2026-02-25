import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
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
import { Group, GroupSchemaFactory } from 'src/group/group.schema';
import { GroupService } from 'src/group/group.service';
import { RedisService } from 'src/redis/redis.service';
import { PlayerStats, PlayerStatsSchemaFactory, ProStats, ProStatsSchemaFactory } from 'src/player-stats/player-stats.schema';
import { PlayerStatsService } from 'src/player-stats/player-stats.service';
import { ServerReceiverOnNetService } from 'src/server-receiver-on-net/server-receiver-on-net.service';
import { ServerReceiverOnNet, ServerReceiverOnNetSchemaFactory, ServerReceiverSinglePlay, ServerReceiverSinglePlaySchemaFactory } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { Template, TemplateSchemaFactory } from 'src/template/template.schema';
import { TemplateService } from 'src/template/template.service';

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
        name: ServerReceiverOnNet.name,
        useFactory: ServerReceiverOnNetSchemaFactory,
      },
      {
        name: ServerReceiverSinglePlay.name,
        useFactory: ServerReceiverSinglePlaySchemaFactory,
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
      },

      {
        name: Group.name,
        useFactory: GroupSchemaFactory,
      },

      {
        name: PlayerStats.name,
        useFactory: PlayerStatsSchemaFactory,
      },
      {
        name: ProStats.name,
        useFactory: ProStatsSchemaFactory,
      },


      {
        name: Template.name,
        useFactory: TemplateSchemaFactory,
      },
    ]),

    ConfigModule,
  ],

  providers: [
    CloudinaryService,
    TemplateService,
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
    RoomService,
    EmailsenderService,
    PlayerRankingService,
    GroupService,
    RedisService,
    PlayerStatsService,
    ServerReceiverOnNetService,
  ],
  exports: [
    CloudinaryService,
    TemplateService,
    UserService,
    PlayerService,
    TeamService,
    EventService,
    MatchService,
    RoundService,
    NetService,
    ServerReceiverOnNetService,
    PlayerService,
    LdoService,
    SponsorService,
    RoomService,
    EmailsenderService,
    PlayerRankingService,
    GroupService,
    RedisService,
    PlayerStatsService,
  ],
})
export class SharedModule {
  constructor(private modRef: ModuleRef, private configService: ConfigService) { }

  async onApplicationBootstrap() {
    try {
      const userService = this.modRef.get(UserService);
      // const hashedPassword = await bcrypt.hash(this.configService.get<string>('ADMIN_PASSWORD'), 10);
      const adminList = [
        {
          firstName: this.configService.get<string>('ADMIN1_FIRST_NAME'),
          lastName: this.configService.get<string>('ADMIN1_LAST_NAME'),
          role: UserRole.admin,
          active: true,
          email: this.configService.get<string>('ADMIN1_EMAIL'),
          password: this.configService.get<string>('ADMIN1_PASSWORD'),
          passcode: this.configService.get<string>('ADMIN1_PASSCODE'),
        },
        {
          firstName: this.configService.get<string>('ADMIN2_FIRST_NAME'),
          lastName: this.configService.get<string>('ADMIN2_LAST_NAME'),
          role: UserRole.admin,
          active: true,
          email: this.configService.get<string>('ADMIN2_EMAIL'),
          password: this.configService.get<string>('ADMIN2_PASSWORD'),
          passcode: this.configService.get<string>('ADMIN2_PASSCODE'),
        },
        {
          firstName: this.configService.get<string>('ADMIN3_FIRST_NAME'),
          lastName: this.configService.get<string>('ADMIN3_LAST_NAME'),
          role: UserRole.admin,
          active: true,
          email: this.configService.get<string>('ADMIN3_EMAIL'),
          password: this.configService.get<string>('ADMIN3_PASSWORD'),
          passcode: this.configService.get<string>('ADMIN3_PASSCODE'),
        },
        {
          firstName: this.configService.get<string>('ADMIN4_FIRST_NAME'),
          lastName: this.configService.get<string>('ADMIN4_LAST_NAME'),
          role: UserRole.admin,
          active: true,
          email: this.configService.get<string>('ADMIN4_EMAIL'),
          password: this.configService.get<string>('ADMIN4_PASSWORD'),
          passcode: this.configService.get<string>('ADMIN4_PASSCODE'),
        },
      ];

      const userPromises = [];
      for (let i = 0; i < adminList.length; i += 1) {
        const adminExist = await userService.findOne({ email: adminList[i].email });
        if (!adminExist) {
          userPromises.push(userService.create(adminList[i]));
        } else {
          const hashedPassword = await bcrypt.hash(adminList[i].password, 10);;
          userPromises.push(
            userService.updateOne({ _id: adminExist._id }, { ...adminList[i], password: hashedPassword }),
          );
        }
      }
      if (userPromises.length > 0) await Promise.all(userPromises);
    } catch (error) {
      console.log(error);
    }
  }
}
