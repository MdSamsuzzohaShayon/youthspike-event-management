import { ArgsType, Field, ID, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class CreateTeamInput {
  @Field()
  name: string;

  @Field()
  active: boolean;

  @Field()
  division: string;

  @Field()
  captain?: string;

  @Field()
  event: string;

  @Field(() => [ID], { nullable: true })
  players?: string[];
}


@InputType()
export class UpdateTeamInput extends PartialType(CreateTeamInput) {}
