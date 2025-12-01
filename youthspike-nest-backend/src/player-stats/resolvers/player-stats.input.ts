import { ArgsType, Field, ID, InputType, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class PlayerStatsInput {
  @Field()
  name: string;

}
