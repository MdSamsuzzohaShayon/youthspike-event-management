// events.dto.ts
import { Field, Float, InputType, Int, ObjectType, PartialType } from '@nestjs/graphql';
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

  @Field(() => String,{nullable: true})
  logo: string;
}


@InputType()
export class ProStatsInput{
  @Field(() => Float, { nullable: true })
  servingPercentage: number; // serving %

  @Field(() => Float, { nullable: true })
  acePercentage: number; // Ace %

  @Field(() => Float, { nullable: true })
  receivingPercentage: number; // Receiving %

  @Field(() => Float, { nullable: true })
  hittingPercentage: number; // Hiting %

  @Field(() => Float, { nullable: true })
  settingPercentage: number; // Setting %

  @Field(() => Float, { nullable: true })
  defensiveConversionPercentage: number; // DC%
}


@InputType()
export class UpdateProStatsInput extends PartialType(ProStatsInput) {}

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

  @Field(() => String,{nullable: true})
  ldo?: string;

  @Field(() => String,{nullable: true})
  id?: string;

  @Field({ nullable: true, defaultValue: true })
  defaultSponsor: boolean;
}

@InputType()
export class UpdateEventInput extends PartialType(CreateEventInput) {}


@ObjectType()
export class CreateEventBody {
  @Field(() => [EventSponsorInput], { nullable: true })
  sponsorsInput?: EventSponsorInput[];

  @Field(() => CreateEventInput)
  input: CreateEventInput;

  context: any;

  
  @Field(() => ProStatsInput, { nullable: true })
  multiplayerInput?: ProStatsInput;

  @Field(() => ProStatsInput, { nullable: true })
  weightInput?: ProStatsInput;

  @Field(() => GraphQLUpload, { nullable: true })
  logo?: Upload;

}

@ObjectType()
export class UpdateEventBody{
  @Field(() => [EventSponsorInput], { nullable: true })
  sponsorsInput?: EventSponsorInput[];

  @Field(() => UpdateEventInput)
  updateInput: UpdateEventInput;

  @Field()
  eventId: string;

  context: any;

  @Field(() => [EventSponsorStringInput], { nullable: true })
  sponsorsStringInput?: EventSponsorStringInput[];

  @Field(() => UpdateProStatsInput, { nullable: true })
  multiplayerInput?: UpdateProStatsInput;

  @Field(() => UpdateProStatsInput, { nullable: true })
  weightInput?: UpdateProStatsInput;
  
  @Field(() => GraphQLUpload, { nullable: true })
  logo?: Upload;
}
