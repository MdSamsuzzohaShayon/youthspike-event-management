import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AppDocument {
  @Field({ nullable: true })
  _id?: string;
}
