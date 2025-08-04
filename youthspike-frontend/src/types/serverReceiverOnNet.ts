import { INetRelatives } from './net';
import { IPlayer } from './player';
import { IRoundRelatives } from './round';
import { IMatch } from './socket';

/**
 * Score keeper
 */
export interface IServerReceiverCommon {
  play: number;

  server: string | IPlayer;
  servingPartner: string | IPlayer;
  receiver: string | IPlayer;
  receivingPartner: string | IPlayer;
  match: string | IMatch;
  net: string | INetRelatives;
  round: string | IRoundRelatives;
  teamAScore: number;
  teamBScore: number;

  // Optional related fields
  serverId?: string;
  netId?: string;
  receiverId?: string;
  receivingPartnerId?: string;
  servingPartnerId?: string;
  matchId?: string;
  roundId?: string;
}

export interface IServerReceiverOnNetMixed extends IServerReceiverCommon {
  mutate: number;
  room: string;
  round: string | IRoundRelatives;
  roundId?: string;
}

export interface IServerReceiverSinglePlay extends IServerReceiverCommon {}

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

/**
 * Responses
 */

// Score keeper
interface IServerReceiverCommonResponse {
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  serverReceiversOnNet: IServerReceiverOnNetMixed[];
}
export interface IResetServerReceiverResponse extends IServerReceiverCommonResponse {
  data: { net: string };
}

export interface IServerReceiverResponse extends IServerReceiverCommonResponse {
  data: IServerReceiverOnNetMixed;
}
export interface ISRConfirmResponse extends IServerReceiverResponse {
  setActionPreview: React.Dispatch<React.SetStateAction<boolean>>;
}
