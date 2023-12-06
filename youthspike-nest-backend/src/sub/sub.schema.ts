/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { AppDocument } from 'src/shared/schema/document.schema';
import { User } from 'src/user/user.schema';

@ObjectType()
@Schema({ timestamps: true })
export class Sub extends AppDocument {
  @Field({})
  @Prop({ required: true })
  roundId: string;

  @Field((type) => [String], { nullable: false })
  @Prop({ required: true, default: [] })
  players: string[];

  @Field((type) => [User], { nullable: true })
  playerObjects?: User[];
}

const SubSchema = SchemaFactory.createForClass(Sub);
export const SubSchemaFactory = async () => {
  return SubSchema;
};
