import { IEvent, IGroup, IPlayerRanking, IPlayerRankingItem, IResponse, ITeam } from ".";
import { IDocument } from "./document";

/**
 * Player Status
 */
export enum EPlayerStatus {
  "ACTIVE" = "ACTIVE",
  "INACTIVE" = "INACTIVE",
}


export interface IPlayerAdd {
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  phone?: string;
  division: string;
  event?: string;
  team?: string;
}

export interface IPlayer extends IDocument {
  firstName: string;
  lastName: string;
  username: string;
  profile: string | null;
  phone?: string;
  division: string;
  email: string;
  status: EPlayerStatus,
  events?: string[];
  teams?: string[];
  captainofteams: ITeam[] | string[] | null;
  cocaptainofteams: ITeam[] | string[] | null;
}

export interface IPlayerExpRel extends IDocument {
  firstName: string;
  lastName: string;
  profile: string | null;
  username: string;
  phone?: string;
  division: string;
  email?: string;
  status: EPlayerStatus,
  events?: IEvent[];
  teams?: ITeam[];
  captainofteams: ITeam[] | null;
  cocaptainofteams: ITeam[] | null;
}

export interface IPlayerAndTeamsResponse{
  getPlayerAndTeams: {
    code: number,
    message: string;
    data: {
      player: IPlayer;
      teams: ITeam[];
    };
  };
}

export interface IEventPlayersGroupsTeamsResponse {
  getEventWithPlayers: {
    code: number,
    message: string;
    data: {
      event: IEvent;
      players: IPlayerExpRel[];
      groups: IGroup[];
      teams: ITeam[];
      playerRankings: IPlayerRanking[];
      rankings: IPlayerRankingItem[];
    };
  };
}

export interface IPlayerRank extends IPlayerExpRel {
  rank?: number;
}

export interface IUpdatePlayerRes extends IResponse{
  data?: IPlayerExpRel;
}

