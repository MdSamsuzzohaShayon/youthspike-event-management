import { Field, InputType, PartialType } from '@nestjs/graphql';
import { PlayerStatus } from './player.schema';

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
export class UpdatePlayerInput extends PartialType(CreatePlayerInput) {
  @Field({ nullable: true })
  status?: PlayerStatus;
}

@InputType()
export class UpdatePlayersInput extends PartialType(CreatePlayerInput) {
  @Field()
  _id: string;
}


@InputType()
export class RankingPlayerInput{
  @Field({nullable: false})
  rank: number;
  
  @Field({nullable: false})
  playerId: string;
}
