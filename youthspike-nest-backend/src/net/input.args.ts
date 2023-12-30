import { Field, InputType, PartialType } from '@nestjs/graphql';

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
}
