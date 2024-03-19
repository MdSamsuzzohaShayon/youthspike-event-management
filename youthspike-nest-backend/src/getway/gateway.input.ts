import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { IsOptional, IsNotEmpty } from 'class-validator';
import { ETieBreaker } from 'src/net/net.schema';

@InputType()
export class JoinRoomInput {
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
export class CheckInInput {

  @Field({ nullable: false })
  room: string;

  @Field({ nullable: false })
  round: string;

  @Field({ nullable: true })
  teamAProcess: string;

  @Field({ nullable: true })
  teamBProcess: string;
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
export class NetPointsAssign {
  @Field({ nullable: false })
  _id: string;
  @Field({ nullable: true })
  teamAScore: number;
  @Field({ nullable: true })
  teamBScore: number;
}


@ObjectType()
export class UpdatePointsInput {
  @Field({ nullable: false })
  round: string;

  @Field(() => [NetPointsAssign], { nullable: false })
  nets: NetPointsAssign[]

  @Field({ nullable: false })
  room: string;
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
  nets: NetPointsAssign[]

  @Field({ nullable: false })
  room: string;
}




@InputType()
export class SubmitLineupInput {

  @Field({ nullable: false })
  room: string;

  @Field({ nullable: false })
  round: string;

  @Field({ nullable: false })
  teamAId: string;

  @Field({ nullable: false })
  teamBId: string;

  @Field({ nullable: true })
  teamAProcess: string;

  @Field({ nullable: true })
  teamBProcess: string;

  @Field(()=> [String],{defaultValue: [], nullable: true})
  subbedPlayers: string[]

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
export class UpdateRoomInput extends PartialType(JoinRoomInput) { }