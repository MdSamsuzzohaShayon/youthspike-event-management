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
class NetAssign {
  _id: string;
  teamAPlayerA: string | null | undefined;
  teamAPlayerB: string | null | undefined;
  teamBPlayerA: string | null | undefined;
  teamBPlayerB: string | null | undefined;
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