import { IAccessCode, IMatch, IMatchExpRel, IUser } from '.';
import { INetRelatives } from './net';
import { IPlayer } from './player';
import { IRoundRelatives } from './round';


export enum EServerPositionPair {
  PAIR_A_TOP = 'PAIR_A_TOP',
  PAIR_A_LEFT = 'PAIR_A_LEFT',

  PAIR_B_BOTTOM = 'PAIR_B_BOTTOM',
  PAIR_B_RIGHT = 'PAIR_B_RIGHT',
}

/**
 * Score keeper
 */
export interface IServerReceiverCommon {
  play: number;

  server: string | IPlayer| null;
  servingPartner: string | IPlayer| null;
  receiver: string | IPlayer| null;
  receivingPartner: string | IPlayer| null;
  match: string | IMatch;
  net: string | INetRelatives;
  round: string | IRoundRelatives;
  teamAScore: number;
  teamBScore: number;

  // According to server position, all other position will be selected
  serverPositionPair: EServerPositionPair;

  // Optional related fields
  serverId?: string | null;
  netId?: string| null;
  receiverId?: string| null;
  receivingPartnerId?: string| null;
  servingPartnerId?: string| null;
  matchId?: string| null;
}

export interface IServerReceiverOnNetMixed extends IServerReceiverCommon {
  mutate: number;
  room: string;
  round: string | IRoundRelatives;
  roundId?: string;
}


export interface IServerReceiverProps {
  matchId: string;
  matchData: IMatchExpRel;
  accessCode: IAccessCode | null;
  token: string | null;
  userInfo: IUser | null;
}


export enum EServerReceiverAction {
  SERVER_ACE_NO_TOUCH = 'SERVER_ACE_NO_TOUCH',
  SERVER_ACE_NO_THIRD_TOUCH = 'SERVER_ACE_NO_THIRD_TOUCH',
  SERVER_RECEIVING_HITTING_ERROR = 'SERVER_RECEIVING_HITTING_ERROR',
  SERVER_DEFENSIVE_CONVERSION = 'SERVER_DEFENSIVE_CONVERSION',
  SERVER_DO_NOT_KNOW = 'SERVER_DO_NOT_KNOW',

  RECEIVER_SERVICE_FAULT = 'RECEIVER_SERVICE_FAULT',
  RECEIVER_ONE_TWO_THREE_PUT_AWAY = 'RECEIVER_ONE_TWO_THREE_PUT_AWAY',
  RECEIVER_RALLEY_CONVERSION = 'RECEIVER_RALLEY_CONVERSION',
  RECEIVER_DO_NOT_KNOW = 'RECEIVER_DO_NOT_KNOW',
}

export interface IServerReceiverSinglePlay extends IServerReceiverCommon {
  action: EServerReceiverAction;
}



export interface IActionResponse{
  serverReceiverOnNet: IServerReceiverOnNetMixed,
  singlePlay: IServerReceiverSinglePlay;
}




export enum EPosition {
  POSITION_A = "POSITION_A",
  POSITION_B = "POSITION_B",
}

export enum EPair {
  PAIR_A = "PAIR_A",
  PAIR_B = "PAIR_B",
}

export enum ESide {
  LEFT = "LEFT",
  TOP = "TOP",
  BOTTOM = "BOTTOM",
  RIGHT = "RIGHT",
}


/**
 * Responses
 */

// Score keeper
interface IServerReceiverCommonResponse {
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  serverReceiversOnNet: IServerReceiverOnNetMixed[]; // From redux store
  currServerReceiver: IServerReceiverOnNetMixed | null;
}
export interface IResetServerReceiverResponse extends IServerReceiverCommonResponse {
  data: { net: string };
  serverReceiverPlays: IServerReceiverSinglePlay[];
  setSelectedServer?: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedReceiver?: React.Dispatch<React.SetStateAction<string | null>>;
  setActionPreview?: React.Dispatch<React.SetStateAction<boolean>>;
}



export interface IChangeServerReceiverResponse extends IServerReceiverCommonResponse{
  data: IServerReceiverOnNetMixed;
}


export interface IRevertPlayReceiverResponse extends IServerReceiverCommonResponse {
  data: IServerReceiverOnNetMixed;
  serverReceiverPlays: IServerReceiverSinglePlay[];
  netByNum: Map<number, INetRelatives>; // Within round
  currNetNum: number;
}

export interface IServerReceiverResponse extends IServerReceiverCommonResponse {
  data: IActionResponse;
  serverReceiverPlays: IServerReceiverSinglePlay[];
}

export interface IServerReceiverActionResponse extends IServerReceiverCommonResponse{
  data: IActionResponse;
  serverReceiverPlays: IServerReceiverSinglePlay[];
} 

export interface ISRConfirmResponse extends IServerReceiverCommonResponse {
  data: IServerReceiverOnNetMixed;
  setActionPreview?: React.Dispatch<React.SetStateAction<boolean>>;
  currRound: IRoundRelatives | null;
  currNetNum: number;
  netByNum: Map<number, INetRelatives>;
}
