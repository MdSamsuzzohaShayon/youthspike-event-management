// events.dto.ts
import { Field, InputType, PartialType } from '@nestjs/graphql';
import { EGroupRule } from './group.schema';

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
}
