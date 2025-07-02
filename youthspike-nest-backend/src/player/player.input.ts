import { Field, InputType, PartialType } from '@nestjs/graphql';
import { EPlayerStatus } from './player.schema';

@InputType()
export class CreatePlayerInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  username?: string;

  @Field()
  event: string;

  @Field()
  division: string;

  @Field({ nullable: true })
  email: string;

  @Field({ nullable: true })
  phone: string;


  @Field({ nullable: true })
  team?: string;
}

@InputType()
export class UpdatePlayerInput extends PartialType(CreatePlayerInput) {
  @Field({ nullable: true })
  status?: EPlayerStatus;

  @Field({ nullable: true })
  newTeamId: string;
}

@InputType()
export class UpdatePlayersInput extends PartialType(CreatePlayerInput) {
  @Field()
  _id: string;

  @Field({ nullable: true })
  status?: EPlayerStatus;
}

