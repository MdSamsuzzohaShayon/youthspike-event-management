import { Field, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class CreatePlayerRankingInput {
  @Field()
  player: string;

  @Field()
  rank: number;
}

@InputType()
export class UpdatePlayerRankingInput extends PartialType(CreatePlayerRankingInput) {}
