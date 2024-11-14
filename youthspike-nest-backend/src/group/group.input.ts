// events.dto.ts
import { Field, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class CreateGroupInput {
  @Field()
  name: string;

  @Field()
  active: boolean;

  @Field()
  division: string;

  @Field()
  event: string;

  @Field((_type)=> [String])
  teams: string[];
}

@InputType()
export class UpdateGroupInput extends PartialType(CreateGroupInput) {
  @Field()
  _id: string;
}
