/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Event } from 'src/event/event.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';

/**
 * Group
 * https://docs.nestjs.com/techniques/mongodb#model-injection
 * https://docs.nestjs.com/graphql/resolvers#object-types
 */
@ObjectType()
@Schema({ timestamps: true })
export class Group extends AppDocument {
  /**
   * Base properties
   */
  @Field()
  @Prop({ required: true })
  name: string;

  @Field({ defaultValue: true })
  @Prop({ required: true, default: true })
  active: boolean;

  @Field({ nullable: false })
  @Prop({ required: true })
  division: string;

  @Field(() => [Team], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }] })
  teams: Team[] | string[];

  @Field(() => Event, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Event' })
  event: string | Event;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
export const GroupSchemaFactory = async () => {
  return GroupSchema;
};
