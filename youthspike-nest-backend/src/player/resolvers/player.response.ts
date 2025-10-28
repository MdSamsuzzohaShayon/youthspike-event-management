import { Field, ObjectType } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { Player } from '../player.schema';
import { Event } from 'src/event/event.schema';
import { PlayerRanking, PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';
import { CustomGroup, CustomTeam } from 'src/match/resolvers/match.response';
import { PlayerStatsEntry } from 'src/event/resolvers/event.response';
import { CustomMatch } from 'src/team/resolvers/team.response';

@ObjectType()
export class PlayerResponse extends AppResponse<Player> {
  @Field((_type) => Player, { nullable: true })
  data?: Player;
}

@ObjectType()
export class PlayersResponse extends AppResponse<Player[]> {
  @Field((_type) => [Player], { nullable: true })
  data?: Player[];
}



@ObjectType()
export class CustomPlayer extends Player {
  @Field((_type) => [String], { nullable: false })
  teams: string[];

  @Field((_type) => [String], { nullable: true })
  captainofteams: string[];

  @Field((_type) => [String], { nullable: true })
  cocaptainofteams: string[];
}

@ObjectType()
export class CustomPlayerRanking extends PlayerRanking {
  @Field((_type) => String, { nullable: false })
  team: string;

  @Field((_type) => String, { nullable: true })
  match: string;

  @Field((_type) => [String], { nullable: false })
  rankings: string[];
}

@ObjectType()
export class CustomPlayerRankingItem extends PlayerRankingItem {
  @Field((_type) => String, { nullable: false })
  player: string;

  @Field((_type) => String, { nullable: true })
  playerRanking: string;
}

@ObjectType()
export class EventWithPlayers {
  @Field((_type) => Event, { nullable: false })
  event: Event;

  @Field((_type) => [CustomPlayer], { nullable: false })
  players: CustomPlayer[];

  @Field((_type) => [CustomGroup], { nullable: false })
  groups: CustomGroup[];

  @Field((_type) => [CustomTeam], { nullable: false })
  teams: CustomTeam[];

  // playerRankings, rankings
  @Field((_type) => [CustomPlayerRanking], { nullable: false })
  playerRankings: CustomPlayerRanking[];

  @Field((_type) => [CustomPlayerRankingItem], { nullable: false })
  rankings: CustomPlayerRankingItem[];

}

@ObjectType()
export class GetEventWithPlayersResponse extends AppResponse<EventWithPlayers> {
  @Field((_type) => EventWithPlayers, { nullable: true })
  data?: EventWithPlayers;
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
export class PlayersSearchResponse extends AppResponse<PlayersSearch> {
  @Field((_type) => PlayersSearch, { nullable: true })
  data?: PlayersSearch;
}

@ObjectType()
export class PlayerAndTeams {
  @Field((_type) => CustomPlayer, { nullable: true })
  player?: CustomPlayer;

  @Field((_type) => [CustomTeam], { nullable: true })
  teams?: CustomTeam[];
}

@ObjectType()
export class GetPlayerAndTeamsResponse extends AppResponse<PlayerAndTeams> {
  @Field(() => PlayerAndTeams, { nullable: true })
  data?: PlayerAndTeams;
}