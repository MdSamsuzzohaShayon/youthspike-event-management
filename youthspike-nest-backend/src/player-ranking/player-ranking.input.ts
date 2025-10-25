import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class CreatePlayerRankingInput {
  @Field()
  player: string;

  @Field()
  rank: number;
}

@InputType()
export class UpdatePlayerRankingInput extends PartialType(CreatePlayerRankingInput) {}

@InputType()
export class CreateTeamPlayerRankingInput {
  @Field((_type) => Boolean)
  rankLock: boolean;
}

@InputType()
export class UpdateMatchPlayerRankingInput {
  @Field((_type) => Boolean, { nullable: true })
  rankLock?: boolean;

  @Field((_type) => String, { nullable: true })
  match?: string;
}
