import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsOptional, IsNotEmpty } from 'class-validator';

@InputType()
export class JoinRoomInput {
  @Field({ nullable: false })
  @IsNotEmpty({ message: 'Either match or at least one team (teamA or teamB) must be present' })
  match: string;

  @Field({ nullable: true })
  @IsOptional()
  team: string;
}

@InputType()
export class UpdateRoomInput extends PartialType(JoinRoomInput) { }