import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class CreateMatchInput {
  @Field({ nullable: false })
  event: string;

  @Field({ nullable: false })
  date: Date;

  @Field({ nullable: false })
  netRange: number;
  
  
  @Field({ nullable: true })
  teamA: string;

  @Field({ nullable: true })
  teamB: string;

  // Default properties
  @Field({nullable: true})
  divisions?: string;
  
  @Field({ nullable: true })
  numberOfNets?: number;

  @Field({ nullable: true })
  numberOfRounds?: number;
  
  @Field(() => Int, {nullable: true})
  playerLimit?: number;

  @Field(() => Int, {nullable: true})
  netVariance?: number;

  @Field(()=> String, {nullable: true})
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
  coachPassword?: string;

  @Field({ nullable: false })
  location?: string;
}

@InputType()
export class UpdateMatchInput extends PartialType(CreateMatchInput) {}
