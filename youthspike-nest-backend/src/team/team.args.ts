import { ArgsType, Field, ID, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class CreateTeamInput {
  @Field()
  name: string;

  @Field()
  active: boolean;

  @Field()
  division: string;

  @Field({nullable: true})
  captain?: string;

  @Field()
  event: string;

  @Field(() => [ID], { nullable: true })
  players?: string[];
}


@InputType()
export class UpdateTeamInput extends PartialType(CreateTeamInput) {
  @Field(type => String, { nullable: true })
  cocaptain?: string;

  @Field(type => String, { nullable: true })
  email?: string;
}
