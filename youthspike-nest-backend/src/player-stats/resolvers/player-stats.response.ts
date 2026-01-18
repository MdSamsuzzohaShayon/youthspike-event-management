import { Field, ObjectType } from "@nestjs/graphql";
import { AppResponse } from "src/shared/response";
import { CustomPlayer } from "src/player/resolvers/player.response";
import { CustomGroup, CustomTeam } from "src/match/resolvers/match.response";
import { CustomMatch, CustomNet, CustomRound } from "src/team/resolvers/team.response";
import { PlayerStats, ProStats } from "../player-stats.schema";
import { PlayerStatsEntry } from "src/event/resolvers/event.response";
import { Event } from 'src/event/event.schema';

@ObjectType()
export class PlayerStatsResponse extends AppResponse<PlayerStats[]> {
  @Field((_type) => [PlayerStats], { nullable: true })
  data?: PlayerStats;
}

@ObjectType()
export class PlayersStatsResponse extends AppResponse<PlayerStats[]> {
  @Field((_type) => [PlayerStats], { nullable: true })
  data?: PlayerStats[];
}


@ObjectType()
export class CustomPlayerStats extends PlayerStats {
  @Field((_type) => String, { nullable: true })
  player: string;

  @Field((_type) => String, { nullable: true })
  match: string;

  @Field((_type) => String, { nullable: true })
  net: string;
}

@ObjectType()
export class PlayerStatsDetails {


  @Field((_type) => [CustomGroup], { nullable: false })
  groups: CustomGroup[];

  @Field((_type) => CustomPlayer, { nullable: false })
  player: CustomPlayer;

  @Field((_type) => [CustomPlayer], { nullable: false })
  players: CustomPlayer[];

  @Field((_type) => CustomTeam, { nullable: true })
  team?: CustomTeam;

  @Field((_type) => [CustomTeam], { nullable: true })
  oponents?: CustomTeam[];

  @Field((_type) => [CustomPlayerStats], { nullable: false })
  playerstats: CustomPlayerStats[];

  @Field((_type) => [CustomMatch], { nullable: true })
  matches: CustomMatch[];

  @Field((_type) => [CustomRound], { nullable: true })
  rounds: CustomRound[];

  @Field((_type) => [CustomNet], { nullable: true })
  nets: CustomNet[];

// multiplayer, weight, stats
  @Field((_type) => ProStats, { nullable: true })
  multiplayer: ProStats;

  @Field((_type) => ProStats, { nullable: true })
  weight: ProStats;


  @Field((_type) => ProStats, { nullable: true })
  stats: ProStats;

}

@ObjectType()
export class PlayerWithStatsResponse extends AppResponse<PlayerStatsDetails> {
  @Field((_type) => PlayerStatsDetails, { nullable: true })
  data?: PlayerStatsDetails;
}


@ObjectType()
export class PlayersSearch {
  @Field((_type) => Event, { nullable: false })
  event: Event;

  @Field((_type) => [CustomPlayer], { nullable: false })
  players: CustomPlayer[];

  @Field((_type) => [CustomGroup], { nullable: false })
  groups: CustomGroup[];

  @Field((_type) => [CustomTeam], { nullable: false })
  teams: CustomTeam[];

  @Field((_type) => [CustomMatch], { nullable: false })
  matches: CustomMatch;

  @Field(() => [PlayerStatsEntry])
  statsOfPlayer: PlayerStatsEntry[];
}

@ObjectType()
export class PlayersStatsSearchResponse extends AppResponse<PlayersSearch> {
  @Field((_type) => PlayersSearch, { nullable: true })
  data?: PlayersSearch;
}