import { Field, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class CreateNetInput {
  @Field({ nullable: false })
  match: string;
}

@InputType()
export class UpdateNetInput extends PartialType(CreateNetInput) {}
