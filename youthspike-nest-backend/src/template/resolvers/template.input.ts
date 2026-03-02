import {  Field, ID, InputType, Int, PartialType } from '@nestjs/graphql';
import { ETemplateType } from '../template.schema';


@InputType()
export class CreateTemplateInput {
  @Field()
  name: string;

  @Field((_type) => Boolean, { nullable: false, defaultValue: false })
  default: boolean;

  @Field(() => ETemplateType)
  type: ETemplateType;

  @Field()
  subject: string;

  @Field()
  body: string;

  @Field(() => [String], { nullable: true })
  images?: string[];

  @Field(() => [String], { nullable: true })
  placeholders?: string[];

  @Field(() => String)
  event: string;
}
@InputType()
export class UpdateTemplateInput extends PartialType(CreateTemplateInput) {}


@InputType()
export class TemplateSearchFilter{
  @Field((_type) => String, { nullable: true })
  event?: string;

  @Field((_type) => String, { nullable: true })
  search?: string;

  @Field((_type) => Int, { nullable: true, defaultValue: 0 })
  offset?: number;

  @Field((_type) => Int, { nullable: true, defaultValue: 30 })
  limit?: number;
}
