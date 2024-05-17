import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from '../user/user.schema';
import * as evt from '../event/event.schema';
import mongoose from 'mongoose';
import { AppDocument } from 'src/shared/schema/document.schema';
import * as bcrypt from 'bcrypt';

/**
 * LDO means League director Organization
 */
@ObjectType()
@Schema({ timestamps: true })
export class LDO extends AppDocument {
  @Prop({ required: true })
  @Field({ nullable: false })
  name: string;

  @Prop({ required: false })
  @Field({ nullable: true })
  phone?: string;

  @Prop({ required: false })
  @Field({ nullable: true })
  logo?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  @Field(() => User, { nullable: true })
  director?: User | string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }] })
  @Field(() => [evt.Event], { nullable: true })
  events: evt.Event[] | string[];
}

export const LDOSchema = SchemaFactory.createForClass(LDO);

export const LDOSchemaFactory = async () => {
  return LDOSchema;
};
