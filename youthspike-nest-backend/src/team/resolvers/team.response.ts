import { Field, ObjectType } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { Team } from '../team.schema';
import { Group } from 'src/group/group.schema';
import { Player } from 'src/player/player.schema';
import { Event } from 'src/event/event.schema';
import { PlayerRanking, PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';
import { Match } from 'src/match/match.schema';
import { Round } from 'src/round/round.schema';
import { Net } from 'src/net/net.schema';
import { CustomPlayer, CustomPlayerRanking, CustomPlayerRankingItem } from 'src/player/resolvers/player.response';
import { PlayerStatsEntry } from 'src/event/resolvers/event.response';
import { CustomGroup, CustomTeam } from 'src/match/resolvers/match.response';

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

  @Field((_type) => String, { nullable: true })
  captain?: string; // Make the captain field nullable
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

@ObjectType()
export class CustomRound extends Round {
  @Field((_type) => String, { nullable: true })
  match: string;

  @Field((_type) => [String], { nullable: true })
  nets: string[];
}

@ObjectType()
export class CustomNet extends Net {
  @Field((_type) => String, { nullable: true })
  match: string;

  @Field((_type) => String, { nullable: true })
  round: string;

  @Field((_type) => String, { nullable: true })
  teamA: string;

  @Field((_type) => String, { nullable: true })
  teamB: string;
}

@ObjectType()
export class CustomMatch extends Match {
  @Field((_type) => String, { nullable: true })
  group: string;

  @Field((_type) => [String], { nullable: true })
  rounds: string[];

  @Field((_type) => [String], { nullable: true })
  nets: string[];

  @Field((_type) => String, { nullable: true })
  teamA: string;

  @Field((_type) => String, { nullable: true })
  teamB: string;
}

@ObjectType()
export class CustomEvent extends Event {
  @Field((_type) => [String], { nullable: true })
  groups: string[];
}

@ObjectType()
export class CaptainPlayer extends Player {
  @Field((_type) => [String], { nullable: true })
  captainofteams: string[];
}

@ObjectType()
export class CoCaptainPlayer extends Player {
  @Field((_type) => [String], { nullable: true })
  cocaptainofteams: string[];
}

// { team, playerRanking, players, group, captain, event }

/*
          team,
          playerRanking,
          players,
          event,
          statsOfPlayer: statsArray,
          rankings,
*/

@ObjectType()
export class TeamRoster {
  @Field((_type) => Team, { nullable: true })
  team: Team;

  @Field((_type) => [CustomPlayer], { nullable: true })
  players: CustomPlayer[];

  @Field((_type) => CustomPlayerRanking, { nullable: true })
  playerRanking: CustomPlayerRanking;

  @Field((_type) => [CustomPlayerRankingItem], { nullable: true })
  rankings: CustomPlayerRankingItem[];

  @Field((_type) => Event, { nullable: true })
  event: Event;

  @Field(() => [PlayerStatsEntry])
  statsOfPlayer: PlayerStatsEntry[];
}

@ObjectType()
export class TeamMatches {
  @Field((_type) => CustomTeam, { nullable: true })
  team: CustomTeam;

  @Field((_type) => [CustomTeam], { nullable: true })
  teams: CustomTeam[];

  @Field((_type) => Event, { nullable: true })
  event: Event;

  @Field((_type) => [CustomMatch], { nullable: true })
  matches: CustomMatch[];

  @Field((_type) => [CustomRound], { nullable: true })
  rounds: CustomRound[];

  @Field((_type) => [CustomNet], { nullable: true })
  nets: CustomNet[];
}

@ObjectType()
export class TeamDetails extends TeamRoster {
  @Field((_type) => Group, { nullable: true })
  group: Group;

  @Field((_type) => CaptainPlayer, { nullable: true })
  captain: CaptainPlayer;

  @Field((_type) => CoCaptainPlayer, { nullable: true })
  cocaptain: CoCaptainPlayer;

  @Field((_type) => [CustomMatch], { nullable: true })
  matches: CustomMatch[];

  @Field((_type) => [CustomRound], { nullable: true })
  rounds: CustomRound[];

  @Field((_type) => [CustomNet], { nullable: true })
  nets: CustomNet[];

  // @Field((_type) => [Team], { nullable: true })
  // oponentTeams: Team[];
  @Field((_type) => [Team], { nullable: true })
  teams: Team[];
}

@ObjectType()
export class GetTeamDetailsResponse extends AppResponse<TeamDetails> {
  @Field((_type) => TeamDetails, { nullable: true })
  data?: TeamDetails;
}

@ObjectType()
export class GetTeamRosterResponse extends AppResponse<TeamRoster> {
  @Field((_type) => TeamRoster, { nullable: true })
  data?: TeamRoster;
}

@ObjectType()
export class GetTeamMatchesResponse extends AppResponse<TeamMatches> {
  @Field((_type) => TeamMatches, { nullable: true })
  data?: TeamMatches;
}

// // event, teams, matches, nets, rounds, groups
@ObjectType()
export class TeamSearch {
  @Field((_type) => CustomEvent, { nullable: true })
  event: CustomEvent;

  @Field((_type) => [CustomTeam], { nullable: true })
  teams: CustomTeam[];

  @Field((_type) => [CustomGroup], { nullable: true })
  groups: CustomGroup[];

  @Field((_type) => [CustomNet], { nullable: true })
  nets: CustomNet[];

  @Field((_type) => [CustomRound], { nullable: true })
  rounds: CustomRound[];

  @Field((_type) => [CustomMatch], { nullable: true })
  matches: CustomMatch[];
}

@ObjectType()
export class GetTeamSearchResponse extends AppResponse<TeamSearch> {
  @Field((_type) => TeamSearch, { nullable: true })
  data?: TeamSearch;
}

@ObjectType()
class Teamstandings {
  // event, groups, matches, teams
  @Field((_type) => Event, { nullable: true })
  event: Event;

  @Field((_type) => [CustomTeam], { nullable: true })
  teams: CustomTeam[];

  @Field((_type) => [CustomGroup], { nullable: true })
  groups: CustomGroup[];

  @Field((_type) => [CustomMatch], { nullable: true })
  matches: CustomMatch[];

  @Field((_type) => [CustomRound], { nullable: true })
  rounds: CustomRound[];

  @Field((_type) => [CustomNet], { nullable: true })
  nets: CustomNet[];
}

@ObjectType()
export class GetTeamstandingsResponse extends AppResponse<Teamstandings> {
  @Field((_type) => Teamstandings, { nullable: true })
  data?: Teamstandings;
}
