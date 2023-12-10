import { Field, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class CreatePlayerInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  event: string;

  @Field()
  email: string;

  @Field()
  rank?: number;

  @Field({ nullable: true })
  team?: string;
}

@InputType()
export class UpdatePlayerInput extends PartialType(CreatePlayerInput) {}
