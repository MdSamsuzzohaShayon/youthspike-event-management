import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { IsOptional, IsNotEmpty } from 'class-validator';
import { ETieBreaker } from 'src/net/net.schema';
import { UserRole } from 'src/user/user.schema';

export enum ETeam {
  teamA = 'teamA',
  teamB = 'teamB',
}

@InputType()
export class UserInput {
  // Additional
  @Field({ nullable: false })
  userRole: UserRole;

  // Additional
  @Field({ nullable: true })
  userId?: string;
}

@InputType()
export class JoinRoomInput extends UserInput {
  @Field({ nullable: false })
  @IsNotEmpty({ message: 'Either match or at least one team (teamA or teamB) must be present' })
  match: string;

  @Field({ nullable: false })
  round: string;

  @Field({ nullable: true })
  @IsOptional()
  team: string;
}

@InputType()
export class CheckInInput extends UserInput {
  @Field({ nullable: false })
  room: string;

  @Field({ nullable: false })
  round: string;

  @Field({ nullable: true })
  teamAProcess: string;

  @Field({ nullable: true })
  teamBProcess: string;

  @Field({ nullable: true })
  teamE: ETeam;
}

@InputType()
export class RoundChangeInput {
  @Field({ nullable: false })
  room: string;

  @Field({ nullable: false })
  round: string;

  @Field({ nullable: false })
  nextRound: string;
}

@ObjectType()
export class NetAssign {
  @Field({ nullable: false })
  _id: string;
  @Field({ nullable: true })
  teamAPlayerA: string | null | undefined;
  @Field({ nullable: true })
  teamAPlayerB: string | null | undefined;
  @Field({ nullable: true })
  teamBPlayerA: string | null | undefined;
  @Field({ nullable: true })
  teamBPlayerB: string | null | undefined;
}


@ObjectType()
export class SetServerReceiverInput {
  // Server ID, Receiver ID, Round ID, Net ID
  @Field({ nullable: false })
  match: string;
 
  @Field({ nullable: false })
  room: string;

  @Field({ nullable: false })
  server: string;

  @Field({ nullable: true })
  receiver: string;

  @Field({ nullable: true })
  round: string;

  @Field({ nullable: true })
  net: string;

  @Field({ nullable: true })
  accessCode: string;


}

@ObjectType()
export class NetPointsAssign {
  @Field({ nullable: false })
  _id: string;
  @Field({ nullable: true })
  teamAScore: number;
  @Field({ nullable: true })
  teamBScore: number;
}

@ObjectType()
export class ExtendOvertimeInput {
  @Field({ nullable: false })
  round: string;

  @Field({ nullable: false })
  room: string;
}

@ObjectType()
export class UpdatePointsInput extends ExtendOvertimeInput{

  @Field(() => [NetPointsAssign], { nullable: false })
  nets: NetPointsAssign[];

  @Field({ nullable: false })
  teamE: ETeam;
}

@ObjectType()
export class RoundResoponse {
  @Field({ nullable: false })
  _id: string;

  @Field({ nullable: true })
  teamAScore: number;

  @Field({ nullable: true })
  teamBScore: number;

  @Field({ nullable: false })
  completed: boolean;
}

@ObjectType()
export class RoundUpdatedResponse {
  @Field({ nullable: false })
  round: RoundResoponse;

  @Field(() => [NetPointsAssign], { nullable: false })
  nets: NetPointsAssign[];

  @Field({ nullable: false })
  room: string;

  @Field({ nullable: false })
  matchCompleted: boolean;

  @Field({ nullable: true })
  teamAProcess: string;

  @Field({ nullable: true })
  teamBProcess: string;
}

@InputType()
export class SubmitLineupInput extends UserInput {
  @Field({ nullable: false })
  eventId: string;

  @Field({ nullable: false })
  room: string;

  @Field({ nullable: false })
  round: string;

  @Field({ nullable: false })
  teamE: ETeam;

  @Field({ nullable: false })
  match: string;

  @Field({ nullable: false })
  teamAId: string;

  @Field({ nullable: false })
  teamBId: string;

  @Field({ nullable: true })
  teamAProcess: string;

  @Field({ nullable: true })
  teamBProcess: string;

  @Field(() => [String], { defaultValue: [], nullable: true })
  subbedPlayers: string[];

  @Field(() => [NetAssign], { nullable: false })
  nets: NetAssign[];
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
export class UpdateRoomInput extends PartialType(JoinRoomInput) {}

// ===== Public  =====

export class CreateEventInput {
  @Field({ nullable: false })
  eventId: string;
}
