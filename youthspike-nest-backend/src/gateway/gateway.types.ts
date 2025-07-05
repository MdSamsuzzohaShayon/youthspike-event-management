import { UserRole } from 'src/user/user.schema';
import { EActionProcess } from 'src/round/round.schema';
import { ERosterLock } from 'src/event/event.schema';
import { EPlayerStatus } from 'src/player/player.schema';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { ETieBreaker } from 'src/net/net.schema';

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

export interface UpdatePointsInput {
  userId: string;
  room: string;
  round: string;
  match: string;
  nets: Array<{
    _id: string;
    teamAScore?: number;
    teamBScore?: number;
  }>;
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


export interface SetPlayersInput {
  userId: string;
  room: string;
  round: string;
  match: string;
  net: string;
  server: string;
  receiver: string;
  accessCode: string;
}

export class ServiceFaultInput{
  @Field({nullable: false})
  match: string;

  @Field({nullable: false})
  receiver: string;
  
  @Field({nullable: false})
  net: string;

  @Field({nullable: false})
  room: string;
}

export interface RoundUpdatedResponse {
  nets: any[];
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
  nets: any[];
  _id: string;
  match: string;
  matchCompleted: boolean;
}

@ObjectType()
export class ServerReceiverOnNet {
  @Field({ nullable: false })
  mutate: number;

  @Field({ nullable: false })
  server: string;

  @Field({ nullable: false })
  servingPartner: string;

  @Field({ nullable: false })
  receiver: string;

  @Field({ nullable: false })
  receivingPartner: string;

  @Field({ nullable: false })
  room: string;

  @Field({ nullable: false })
  match: string;

  @Field({ nullable: false })
  net: string;

  @Field({ nullable: false })
  round: string;

  @Field({ nullable: false, defaultValue: 0 })
  teamAScore: number;

  @Field({ nullable: false, defaultValue: 0 })
  teamBScore: number;
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