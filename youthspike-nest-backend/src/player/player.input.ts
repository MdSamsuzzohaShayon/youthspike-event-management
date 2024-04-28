import { Field, InputType, PartialType } from '@nestjs/graphql';
import { EPlayerStatus } from './player.schema';

@InputType()
export class CreatePlayerInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  event: string;

  @Field()
  division: string;

  @Field({ nullable: true })
  email: string;

  @Field({ nullable: true })
  phone: string;

  @Field()
  rank?: number;

  @Field({ nullable: true })
  team?: string;
}

@InputType()
export class UpdatePlayerInput extends PartialType(CreatePlayerInput) {
  @Field({ nullable: true })
  status?: EPlayerStatus;

  @Field({ nullable: true })
  playerTeamId: string;
}

@InputType()
export class UpdatePlayersInput extends PartialType(CreatePlayerInput) {
  @Field()
  _id: string;
}


@InputType()
export class RankingPlayerInput {
  @Field({ nullable: false })
  rank: number;

  @Field({ nullable: false })
  playerId: string;
}
