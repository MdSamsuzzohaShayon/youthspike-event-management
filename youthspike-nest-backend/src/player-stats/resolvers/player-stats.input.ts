import { ArgsType, Field, ID, InputType, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class PlayerStatsInput {
  @Field()
  name: string;

}


export enum EGroupType{
  OVERALL = "OVERALL",
  CONFERENCE = "CONFERENCE",
  NON_CONFERENCE = "NON_CONFERENCE",
}


@InputType()
export class PlayerStatsSearchFilter {
  @Field({ nullable: true })
  ce?: EGroupType; // team, description, location
  
  @Field({ nullable: true })
  search?: string; // team, description, location

  @Field({ nullable: true })
  division?: string; // 

  @Field({ nullable: true })
  group?: string;

  @Field(() => Int, { nullable: true, defaultValue: 30 })
  limit?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  offset?: number;
}
