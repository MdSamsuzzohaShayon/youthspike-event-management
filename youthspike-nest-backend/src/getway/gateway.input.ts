import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { IsOptional, IsNotEmpty } from 'class-validator';

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
export class NetPointsInput {
  @Field({ nullable: false })
  _id: string;
  @Field({ nullable: true })
  teamAScore: number;
  @Field({ nullable: true })
  teamBScore: number;
}

@InputType()
export class SubmitLineupInput {

  @Field({ nullable: false })
  room: string;

  @Field({ nullable: false })
  round: string;

  @Field({ nullable: true })
  teamAProcess: string;

  @Field({ nullable: true })
  teamBProcess: string;

  @Field(() => [NetAssign], { nullable: false })
  nets: NetAssign[];
}

@InputType()
export class UpdateRoomInput extends PartialType(JoinRoomInput) { }