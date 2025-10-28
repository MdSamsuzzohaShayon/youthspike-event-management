import { ArgsType, Field, ID, InputType, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class CreateTeamInput {
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

  @Field()
  event: string;

  @Field(() => [ID], { nullable: true })
  players?: string[];
}

@InputType()
export class UpdateTeamInput extends PartialType(CreateTeamInput) {
  @Field((type) => String, { nullable: true })
  cocaptain?: string;

  @Field((type) => String, { nullable: true })
  email?: string;
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
