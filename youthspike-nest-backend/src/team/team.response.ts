import { Field, ObjectType } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { Team } from './team.schema';
import { Group } from 'src/group/group.schema';
import { Player } from 'src/player/player.schema';
import { Event } from 'src/event/event.schema';

@ObjectType()
export class CreateOrUpdateTeamResponse extends AppResponse<Team> {
  @Field((__type) => Team, { nullable: true })
  data?: Team;
}

@ObjectType()
export class GetTeamsResponse extends AppResponse<Team[]> {
  @Field((_type) => [Team], { nullable: true })
  data?: Team[];
}

@ObjectType()
export class TeamWithStringPlayers extends Team {
  @Field(() => [String], { nullable: true })
  players?: string[];

  @Field((_type) => String, { nullable: true })
  group: string;
}

@ObjectType()
export class PlayerWithTeam extends Player {
  @Field((_type) => [String], { nullable: true })
  teams: string[];
}


@ObjectType()
export class GroupWithTeam extends Group {
  @Field((_type) => [String], { nullable: true })
  teams: string[];
}

@ObjectType()
export class EventWithTeams {
  @Field((_type) => Event, { nullable: true })
  event: Event;

  @Field((_type) => [TeamWithStringPlayers], { nullable: true })
  teams: TeamWithStringPlayers[];

  @Field((_type) => [GroupWithTeam], { nullable: true })
  groups: GroupWithTeam[];

  @Field((_type) => [PlayerWithTeam], { nullable: true })
  players: PlayerWithTeam[];
}

@ObjectType()
export class GetEventWithTeamsResponse extends AppResponse<EventWithTeams> {
  @Field((_type) => EventWithTeams, { nullable: true })
  data?: EventWithTeams;
}

@ObjectType()
export class GetTeamResponse extends AppResponse<Team> {
  @Field((_type) => Team, { nullable: true })
  data?: Team;
}
