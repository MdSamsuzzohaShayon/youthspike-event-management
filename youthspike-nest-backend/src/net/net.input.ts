import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class CreateNetInput {
  @Field({ nullable: false })
  match: string;
}

@InputType()
export class UpdateNetInput extends PartialType(CreateNetInput) {

  @Field({ nullable: true })
  teamAPlayerA?: string | null;

  @Field({ nullable: true })
  teamAPlayerB?: string | null;

  @Field({ nullable: true })
  teamBPlayerA?: string | null;

  @Field({ nullable: true })
  teamBPlayerB?: string | null;

  @Field({ nullable: true })
  streamUrl?: string | null;
}

@InputType()
export class UpdateMultipleNetInput extends PartialType(CreateNetInput) {

  @Field({ nullable: false })
  _id: string;

  @Field({ nullable: true })
  teamAPlayerA?: string | null;

  @Field({ nullable: true })
  teamAPlayerB?: string | null;

  @Field({ nullable: true })
  teamBPlayerA?: string | null;

  @Field({ nullable: true })
  teamBPlayerB?: string | null;

  @Field((type) => Int, { nullable: true })
  teamAScore?: number;

  @Field((type) => Int, { nullable: true })
  teamBScore?: number;

  @Field({ nullable: true })
  streamUrl?: string | null;
}
