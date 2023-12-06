// events.dto.ts
import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import * as Upload from 'graphql-upload/Upload.js';
import { DateScalar } from 'src/shared/date-scaler';

@InputType()
export class CreateEventInput {
  @Field()
  name: string;

  @Field(() => DateScalar)
  startDate: Date;

  @Field(() => DateScalar)
  endDate: Date;

  @Field()
  active: boolean;

  // Default properties
  @Field()
  divisions: string;

  @Field(() => Int)
  nets: number;

  @Field(() => Int)
  rounds: number;
  
  @Field(() => Int)
  playerLimit: number;


  @Field(() => Int)
  netVariance: number;

  @Field()
  homeTeam: string; // Make it required

  @Field({ nullable: true })
  autoAssign: boolean;

  @Field({ nullable: true })
  autoAssignLogic: string;

  @Field({ nullable: true })
  rosterLock: string;

  @Field(() => Int, { nullable: true })
  timeout: number;

  @Field({ nullable: true })
  passcode: string;

  @Field({ nullable: true })
  coachPassword: string;

  @Field({ nullable: true })
  location: string;

  @Field()
  ldo?: string;

  @Field({ nullable: true })
  id?: string;
}

@InputType()
export class UpdateEventInput extends PartialType(CreateEventInput){}
