import { ArgsType, Field, ID, InputType, Int, PartialType } from '@nestjs/graphql';

@InputType()
class CommonInput{
  @Field()
  name: string;

  @Field()
  active: boolean;

  @Field()
  division: string;

  @Field({ nullable: true })
  group?: string;

  @Field({ nullable: true })
  captain?: string;

  @Field(() => [ID], { nullable: true })
  events: string[];
}

@InputType()
export class CreateTeamInput{

  @Field({nullable: false})
  name: string;

  @Field({ nullable: true })
  logo: string;

  @Field({ nullable: false })
  active: boolean;

  @Field({ nullable: false })
  division: string;

  @Field({ nullable: true })
  sendCredentials: boolean;

  // @Field({ nullable: true })
  // num?: number;

  @Field((_type) => String, { nullable: true })
  captain?: string; // Make the captain field nullable

  @Field((_type) => String, { nullable: true })
  cocaptain?: string; // Make the captain field nullable

  @Field((type) => [String], { nullable: true })
  matches?: string[]; // Make the captain field nullable

  @Field((_type) => [String], { nullable: true })
  events?: string[];

  @Field(() => [String], { nullable: true })
  players?: string[]; // Update the type of players to allow null values

  @Field(() => [String], { nullable: true })
  moved?: string[];


  // @Field((_type) => [String], { nullable: true, defaultValue: [] })
  // playerRankings?: string[];


  @Field(() => [String], { nullable: false })
  groups: string[];
}

@InputType()
export class UpdateTeamInput extends PartialType(CreateTeamInput) {

}

@InputType()
export class UpdateTeamsInput {
  @Field((_type) => [String], { nullable: true })
  teamIds: string[];

  @Field((_type) => String, { nullable: true })
  cocaptain?: string;

  @Field((_type) => String, { nullable: true })
  email?: string;

  @Field(() => [String], { nullable: false })
  groups: string[];

  @Field({ nullable: false })
  division: string;

}


@InputType()
export class TeamSearchFilter{
  @Field((_type) => String, { nullable: true })
  division?: string;

  @Field((_type) => String, { nullable: true })
  group?: string;

  @Field((_type) => String, { nullable: true })
  search?: string;

  @Field((_type) => Int, { nullable: true, defaultValue: 0 })
  offset?: number;

  @Field((_type) => Int, { nullable: true, defaultValue: 30 })
  limit?: number;
}
