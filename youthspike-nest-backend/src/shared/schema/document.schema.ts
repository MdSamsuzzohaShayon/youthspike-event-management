import { Field, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';

@ObjectType()
export class AppDocument {
  @Field({ nullable: true })
  _id?:  string;
  // Types.ObjectId |
}
