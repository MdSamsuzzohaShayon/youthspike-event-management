// events.dto.ts
import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';

@InputType()
export class EventSponsorInput {
  @Field()
  company: string;

  @Field(() => GraphQLUpload)
  logo: Upload;
}

@InputType()
export class EventSponsorStringInput {
  @Field()
  company: string;

  @Field()
  logo: string;
}

@InputType()
export class CreateEventInput {
  @Field()
  name: string;

  @Field(() => String)
  startDate: string;

  @Field(() => String)
  endDate: string;

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
  tieBreaking: string;

  @Field({ nullable: true })
  rosterLock: string;

  @Field(() => Int, { nullable: true })
  timeout: number;

  @Field({ nullable: false })
  coachPassword: string;

  @Field({ nullable: true })
  fwango?: string;

  @Field({ nullable: false })
  description: string;

  @Field({ nullable: false })
  location: string;

  @Field({ nullable: true })
  accessCode: string;

  @Field()
  ldo?: string;

  @Field({ nullable: true })
  id?: string;

  @Field({ nullable: true, defaultValue: false })
  defaultSponsor: boolean;
}

@InputType()
export class UpdateEventInput extends PartialType(CreateEventInput) {}
