import { UserRole } from 'src/user/user.schema';
import { EActionProcess } from 'src/round/round.schema';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { ETieBreaker } from 'src/net/net.schema';
import { EServerPositionPair } from 'src/server-receiver-on-net/server-receiver-on-net.schema';

export enum ETeam {
  teamA = 'teamA',
  teamB = 'teamB',
}

export const ROOM_PREFIX = 'room:';
export const SOCKET_PREFIX = 'socket:';
export const CLIENT_TTL = 60 * 60 * 2; // 2 hours TTL for client data

export interface JoinRoomInput {
  userId?: string;
  match: string;
  round: string;
  team?: string;
  userRole?: UserRole;
}

export interface CheckInInput {
  userId: string;
  room: string;
  round: string;
  teamE: ETeam;
  userRole: UserRole;
}

@ObjectType()
export class NetScore {
  @Field({ nullable: false })
  _id: string;
  
  @Field({ nullable: true })
  teamAScore?: number;
  
  @Field({ nullable: true })
  teamBScore?: number;
}



export interface SubmitLineupInput {
  userId: string;
  room: string;
  round: string;
  match: string;
  eventId: string;
  teamE: ETeam;
  teamAId: string;
  teamBId: string;
  nets: Array<{
    _id: string;
    teamAPlayerA?: string;
    teamAPlayerB?: string;
    teamBPlayerA?: string;
    teamBPlayerB?: string;
  }>;
  subbedPlayers: string[];
  userRole: UserRole;
}

@ObjectType()
export class UpdatePointsInput {
  @Field({ nullable: false })
  userId: string;
  
  @Field({ nullable: false })
  room: string;
  
  @Field({ nullable: false })
  round: string;
  
  @Field({ nullable: false })
  match: string;
  
  @Field(() => NetScore, { nullable: false })
  net: NetScore;
}



@ObjectType()
export class NetTieBreaker {
  @Field({ nullable: false })
  _id: string;
  @Field({ nullable: true })
  netType: ETieBreaker;
}

@InputType()
export class TieBreakerInput {
  @Field({ nullable: false })
  room: string;

  @Field({ nullable: false })
  round: string;

  @Field({ nullable: true })
  teamAProcess: string;

  @Field({ nullable: true })
  teamBProcess: string;

  @Field(() => [NetTieBreaker], { nullable: false })
  nets: NetTieBreaker[];
}

@InputType()
export class ExtendOvertimeInput {
  @Field({ nullable: false })
  round: string;

  @Field({ nullable: false })
  room: string;
}

@InputType()
export class SetPlayersInput {
  @Field({ nullable: false })
  userId: string;

  @Field({ nullable: false })
  room: string;

  @Field({ nullable: false })
  round: string;

  @Field({ nullable: false })
  match: string;

  @Field({ nullable: false })
  net: string;

  @Field({ nullable: false })
  server: string;

  @Field({ nullable: false })
  receiver: string;

  @Field({ nullable: false })
  accessCode: string;

  @Field(() => EServerPositionPair, { nullable: false })
  serverPositionPair: EServerPositionPair;
}




@InputType()
class CommonActionInput {
  @Field({ nullable: false })
  match: string;

  @Field({ nullable: false })
  net: string;

  @Field({ nullable: false })
  room: string;
}
@InputType()
export class ServiceFaultInput extends CommonActionInput {}

@InputType()
export class ReceiverDoNotKnowInput extends CommonActionInput {}

@InputType()
export class ServerDoNotKnowInput extends CommonActionInput {}

@InputType()
export class AceNoTouchInput extends CommonActionInput {}

@InputType()
export class AceNoThirdTouchInput extends CommonActionInput {}

@InputType()
export class ReceivingHittingErrorInput extends CommonActionInput {}

@InputType()
export class OneTwoThreePutAwayInput extends CommonActionInput {}

@InputType()
export class RallyConversionInput extends CommonActionInput {}


@InputType()
export class DefensiveConversionInput extends CommonActionInput {}

@InputType()
export class UpdateCachePointsInput extends CommonActionInput {
  @Field({ nullable: false })
  accessCode: string;
}

@InputType()
export class RevertPlayInput extends UpdateCachePointsInput {

  @Field({ nullable: false })
  play: number;
}


@InputType()
export class ResetScoreInput extends UpdateCachePointsInput {}


export interface INetScoreUpdate {
  _id: string;
  teamAScore?: number;
  teamBScore?: number;
  // completed: boolean;
}

export interface RoundUpdatedResponse {
  nets: INetScoreUpdate[];
  room: string;
  round: {
    _id: string;
    teamAScore?: number;
    teamBScore?: number;
    completed?: boolean;
  };
  matchCompleted: boolean;
  teamAProcess: EActionProcess;
  teamBProcess: EActionProcess;
}

export interface MatchRoundNet {
  nets: INetScoreUpdate[];
  _id: string;
  match: string;
  matchCompleted: boolean;
}



export interface GeneralClient {
  _id: string | null;
  matches: string[];
  userRole: UserRole;
  connectedAt?: Date;
  lastActive?: Date;
}

export interface RoomLocal {
  _id: string;
  match: string;
  teamA: string;
  teamAClient: string | null;
  teamB: string;
  teamBClient: string | null;
  rounds: RoomRoundProcess[];
}

export interface RoomRoundProcess {
  _id: string;
  num: number;
  teamAProcess: EActionProcess;
  teamBProcess: EActionProcess;
}
