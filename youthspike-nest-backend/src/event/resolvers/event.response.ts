import { Field, ObjectType } from '@nestjs/graphql';
import { CustomPlayer } from 'src/player/resolvers/player.response';
import { AppResponse } from 'src/shared/response';
import { Sponsor } from 'src/sponsor/sponsor.schema';
import { Event } from '../event.schema';
import { LDO } from 'src/ldo/ldo.schema';
import { PlayerStats, ProStats } from 'src/player-stats/player-stats.schema';
import { Match } from 'src/match/match.schema';
import { CustomPlayerStats } from 'src/player-stats/resolvers/player-stats.response';
import { CustomGroup, CustomTeam, EventMatches } from 'src/match/resolvers/match.response';

@ObjectType()
export class CreateOrUpdateEventResponse extends AppResponse<Event> {
  @Field((_type) => Event, { nullable: true })
  data?: Event;
}

@ObjectType()
export class GetEventsResponse extends AppResponse<Event[]> {
  @Field((_type) => [Event], { nullable: true })
  data?: Event[];
}

@ObjectType()
export class GetEventResponse extends AppResponse<Event> {
  @Field((_type) => Event, { nullable: true })
  data?: Event | null;
}


@ObjectType()
export class CustomEvent extends Event {
  @Field((_type) => [String], { nullable: false })
  teams: string[];

  @Field((_type) => [String], { nullable: true })
  players: string[];

  @Field((_type) => [String], { nullable: true })
  matches: string[];

  @Field((_type) => [String], { nullable: true })
  groups: string[];
}



@ObjectType()
export class PlayerStatsEntry {
  @Field(() => String)
  playerId: string;

  @Field(() => [CustomPlayerStats])
  stats: CustomPlayerStats[];
}

@ObjectType()
export class EventDetails extends EventMatches {
  @Field((_type) => [CustomPlayer], { nullable: false })
  players: CustomPlayer[];

  @Field((_type) => [Sponsor], { nullable: false })
  sponsors: Sponsor[];

  @Field(() => [PlayerStatsEntry])
  statsOfPlayer: PlayerStatsEntry[];
}


@ObjectType()
export class PlayerEventSetting{
  // event, teams, ldo, sponsors, multiplayer, weight, stats, player
  @Field((_type) => Event, { nullable: true })
  event?: Event;

  @Field((_type) => [CustomTeam], { nullable: true })
  teams: CustomTeam[];

  @Field((_type) => LDO, { nullable: true })
  ldo?: LDO;

  @Field((_type) => [Sponsor], { nullable: true })
  sponsors?: Sponsor[];

  @Field((_type) => ProStats, { nullable: true })
  multiplayer?: ProStats;

  @Field((_type) => ProStats, { nullable: true })
  weight?: ProStats;

  @Field((_type) => ProStats, { nullable: true })
  stats?: ProStats;

  @Field((_type) => CustomPlayer, { nullable: true })
  player?: CustomPlayer;
}

@ObjectType()
export class GetEventDetailsResponse extends AppResponse<EventDetails> {
  @Field((_type) => EventDetails, { nullable: true })
  data?: EventDetails | null;
}


@ObjectType()
export class GroupsAndUnassignedPlayers{
  @Field((_type) => Event, { nullable: true })
  event: Event;

  @Field((_type) => [CustomPlayer], { nullable: true })
  players?: CustomPlayer[];

  @Field((_type) => [CustomGroup], { nullable: true })
  groups?: CustomGroup[];
}

@ObjectType()
export class GetEventWithGroupsAndUnassignedPlayersResponse extends AppResponse<GroupsAndUnassignedPlayers> {
  @Field((_type) => GroupsAndUnassignedPlayers, { nullable: true })
  data?: GroupsAndUnassignedPlayers | null;

  
}




@ObjectType()
export class GetPlayerEventSettingResponse extends AppResponse<PlayerEventSetting> {
  @Field((_type) => PlayerEventSetting, { nullable: true })
  data?: PlayerEventSetting | null;
}
