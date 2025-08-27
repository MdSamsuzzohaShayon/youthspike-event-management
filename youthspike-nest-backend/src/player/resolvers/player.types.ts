import { CreateMultiPlayerBody, CreatePlayerBody, UpdatePlayerBody, UpdatePlayersInput } from './player.input';
import { GetEventWithPlayersResponse, GetPlayerAndTeamsResponse, PlayerResponse, PlayersResponse } from './player.response';


export interface IPlayerMutations {
  createPlayer(body: CreatePlayerBody): Promise<PlayerResponse>;
  createMultiPlayers(body: CreateMultiPlayerBody): Promise<PlayersResponse>;
  updatePlayer(body: UpdatePlayerBody): Promise<PlayerResponse>;
  updatePlayers(input: UpdatePlayersInput[]): Promise<PlayersResponse>;
  deletePlayer(context: any, playerId: string): Promise<PlayersResponse>;
}

export interface IPlayerQueries {
  getPlayer(playerId: string): Promise<PlayerResponse>;
  getPlayerAndTeams(playerId: string, eventId: string): Promise<GetPlayerAndTeamsResponse>;
  getPlayers(eventId: string): Promise<PlayersResponse>;
  getEventWithPlayers(context: any, eventId: string): Promise<GetEventWithPlayersResponse>;
}
