import { Field, ObjectType } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { Event } from 'src/event/event.schema';
import { Team } from 'src/team/team.schema';
import { LDO } from 'src/ldo/ldo.schema';
import { Group } from 'src/group/group.schema';
import { CustomMatch, CustomNet, CustomRound } from 'src/team/team.response';
import { Match } from '../match.schema';


@ObjectType()
export class GetMatchesResponse extends AppResponse<Match[]> {
  @Field((_type) => [Match], { nullable: false })
  data?: Match[];
}

@ObjectType()
export class GetMatchResponse extends AppResponse<Match> {
  @Field((_type) => Match, { nullable: true })
  data?: Match | null;
}


@ObjectType()
export class AccessCode{
  @Field((_type)=> String, {nullable: false})
  accessCode: string;
  
  @Field((_type)=> String, {nullable: false})
  match: string;
}

@ObjectType()
export class GetAccessCodeResponse extends AppResponse<AccessCode> {
  @Field((_type) => AccessCode, { nullable: true })
  data?: AccessCode | null;
}



@ObjectType()
export class CustomTeam extends Team {
  @Field((_type) => [String], { nullable: true })
  matches: string[];

  @Field((_type) => [String], { nullable: true })
  nets: string[];

  @Field((_type) => [String], { nullable: true })
  players: string[];

  @Field((_type) => String, { nullable: true })
  captain: string;

  @Field((_type) => String, { nullable: true })
  cocaptain: string;

  @Field((_type) => String, { nullable: true })
  group: string;
}

@ObjectType()
export class CustomGroup extends Group {
  @Field((_type) => [String], { nullable: true })
  teams: string[];
}

@ObjectType()
export class EventMatches {
  // event, matches, teams, ldo, groups
  @Field((_type) => Event, { nullable: false })
  event: Event;

  @Field((_type) => [CustomMatch], { nullable: false })
  matches: CustomMatch[];

  @Field((_type) => [CustomTeam], { nullable: false })
  teams: CustomTeam[];

  @Field((_type) => LDO, { nullable: false })
  ldo: LDO;

  @Field((_type) => [CustomGroup], { nullable: false })
  groups: CustomGroup[];

  @Field((_type) => [CustomNet], { nullable: false })
  nets: CustomNet[];

  @Field((_type) => [CustomRound], { nullable: false })
  rounds: CustomRound[];
}


@ObjectType()
export class GetEventWithMatchesResponse extends AppResponse<EventMatches> {
  @Field((_type) => EventMatches, { nullable: true })
  data?: EventMatches | null;
}


