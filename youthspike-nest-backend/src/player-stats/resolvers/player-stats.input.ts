import { ArgsType, Field, ID, InputType, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class PlayerStatsInput {
  @Field()
  name: string;

}


export enum EGroupType {
  OVERALL = "OVERALL",
  CONFERENCE = "CONFERENCE",
  NON_CONFERENCE = "NON_CONFERENCE",
}


@InputType()
export class PlayerStatsSearchFilter {
  @Field(() => String, { nullable: true })
  ce?: EGroupType; // Conference

  @Field(() => String, { nullable: true })
  search?: string; // team, description, location

  @Field(() => String, { nullable: true })
  division?: string;

  @Field(() => String, { nullable: true })
  group?: string;

  @Field(() => String, { nullable: true })
  event?: string;

  @Field(() => String, { nullable: true })
  startDate?: string;

  @Field(() => String, { nullable: true })
  endDate?: string;

  @Field((_type) => [String], { nullable: true })
  matches?: string[];



  @Field(() => Int, { nullable: true, defaultValue: 30 })
  limit?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  offset?: number;
}
