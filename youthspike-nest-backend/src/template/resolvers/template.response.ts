import { Field, ObjectType } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { Template } from '../template.schema';
import { Event } from 'src/event/event.schema';

@ObjectType()
export class CreateOrUpdateTemplateResponse extends AppResponse<Template> {
  @Field((__type) => Template, { nullable: true })
  data?: Template;
}

@ObjectType()
export class GetTemplatesResponse extends AppResponse<Template[]> {
  @Field((_type) => [Template], { nullable: true })
  data?: Template[];
}



@ObjectType()
export class GetTemplateResponse extends AppResponse<Template> {
  @Field((_type) => Template, { nullable: true })
  data?: Template;
}



@ObjectType()
export class TemplateSearch {
  @Field((_type) => Event, { nullable: true })
  event: Event;

  @Field((_type) => [Template], { nullable: true })
  templates: Template[];

}

@ObjectType()
export class GetTemplateSearchResponse extends AppResponse<TemplateSearch> {
  @Field((_type) => TemplateSearch, { nullable: true })
  data?: TemplateSearch;
}


