import { Field, ObjectType } from "@nestjs/graphql";
import { AppResponse } from "src/shared/response";
import { PlayerStats } from "./player-stats.schema";
import { CustomPlayer } from "src/player/player.response";
import { CustomTeam } from "src/match/match.response";
import { CustomMatch, CustomNet } from "src/team/team.response";

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
}

@ObjectType()
export class PlayerStatsDetails {

  @Field((_type) => CustomPlayer, { nullable: false })
  player: CustomPlayer;

  @Field((_type) => CustomTeam, { nullable: true })
  team?: CustomTeam;

  @Field((_type) => [CustomPlayerStats], { nullable: false })
  playerstats: CustomPlayerStats[];

  @Field((_type) => [CustomMatch], { nullable: true })
  matches: CustomMatch[];

  @Field((_type) => [CustomNet], { nullable: true })
  nets: CustomNet[];

}

@ObjectType()
export class PlayerWithStatsResponse extends AppResponse<PlayerStatsDetails> {
  @Field((_type) => PlayerStatsDetails, { nullable: true })
  data?: PlayerStatsDetails;
}