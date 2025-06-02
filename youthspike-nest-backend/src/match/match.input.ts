import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class CreateMatchInput {
  @Field({ nullable: false })
  event: string;

  @Field({ nullable: false })
  date: string;

  @Field({ nullable: true })
  teamA: string;

  @Field({ nullable: true })
  teamB: string;

  // Default properties
  @Field({ nullable: false })
  division: string;

  @Field({ nullable: true })
  group?: string;

  @Field({ nullable: true })
  numberOfNets?: number;

  @Field({ nullable: true })
  numberOfRounds?: number;


  @Field(() => Int, { nullable: true })
  netVariance?: number;

  @Field({ nullable: true })
  tieBreaking: string;

  @Field(() => String, { nullable: true })
  homeTeam?: string;

  @Field({ nullable: true })
  autoAssign?: boolean;

  @Field({ nullable: true })
  autoAssignLogic?: string;

  @Field({ nullable: true })
  rosterLock?: string;

  @Field(() => Int, { nullable: true })
  timeout?: number;

  @Field({ nullable: false })
  description: string;

  @Field({ nullable: true })
  location?: string;

  @Field({nullable: true})
  accessCode?: string;

  @Field({ nullable: true })
  fwango?: string;
}

@InputType()
export class UpdateMatchInput extends PartialType(CreateMatchInput) {
  @Field({ nullable: true })
  date?: string;
}

@InputType()
export class FilterQueryInput {
  @Field({ nullable: true })
  _id?: string;

  @Field({ nullable: true })
  event?: string;

  @Field({ nullable: true })
  teamA?: string;

  @Field({ nullable: true })
  teamB?: string;

  // Default properties
  @Field({ nullable: true })
  divisions?: string;

  @Field({ nullable: true })
  numberOfNets?: number;

  @Field({ nullable: true })
  numberOfRounds?: number;

  @Field(() => Int, { nullable: true })
  playerLimit?: number;

  @Field(() => Int, { nullable: true })
  netVariance?: number;

  @Field(() => String, { nullable: true })
  homeTeam?: string;

  @Field({ nullable: true })
  autoAssign?: boolean;

  @Field({ nullable: true })
  autoAssignLogic?: string;

  @Field({ nullable: true })
  rosterLock?: string;

  @Field(() => Int, { nullable: true })
  timeout?: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  location?: string;
}

@InputType()
export class AccessCodeInput{
  @Field({nullable: false})
  accessCode: string;

  @Field({nullable: false})
  matchId: string;
}
