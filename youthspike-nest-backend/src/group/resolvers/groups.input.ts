// events.dto.ts
import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { EGroupRule } from '../group.schema';

@InputType()
export class CreateGroupInput {
  @Field()
  name: string;

  @Field()
  active: boolean;

  @Field()
  division: string;

  @Field({ defaultValue: EGroupRule.CAN_PLAY_EACH_OTHER })
  rule: EGroupRule;

  @Field()
  event: string;

  @Field((_type) => [String])
  teams: string[];

  @Field((_type) => [String], {nullable: true})
  matches?: string[];
}

@InputType()
export class UpdateGroupInput extends PartialType(CreateGroupInput) {
  @Field()
  _id: string;

  @Field((_type) => [String], {nullable: true})
  removeteams: string[];
}


@InputType()
export class CreateGroupPointsInput {
  @Field(()=> String, {nullable: false})
  team: string;

  @Field({ nullable: true })
  event?: string;

  @Field(() => Int)
  points: number;

  @Field({ nullable: true })
  notes?: string;
}

@InputType()
export class UpdateGroupPointsInput extends PartialType(CreateGroupPointsInput) {
  @Field()
  _id: string;
}