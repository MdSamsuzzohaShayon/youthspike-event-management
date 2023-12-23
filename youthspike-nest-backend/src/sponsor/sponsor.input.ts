import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class CreateSponsorInput {
  @Field()
  company: string;

  @Field()
  logo: string;
}