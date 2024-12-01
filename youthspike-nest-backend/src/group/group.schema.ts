import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Event } from 'src/event/event.schema';
import { Match } from 'src/match/match.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';

export enum EGroupRule {
  CAN_PLAY_EACH_OTHER = 'CAN_PLAY_EACH_OTHER',
  CAN_NOT_PLAY_EACH_OTHER = 'CAN_NOT_PLAY_EACH_OTHER',
}

registerEnumType(EGroupRule, {
  name: 'EGroupRule',
});

/**
 * Group
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

  @Field({ nullable: false, defaultValue: EGroupRule })
  @Prop({ required: true, default: EGroupRule })
  rule: EGroupRule;

  @Field(() => [Team], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }] })
  teams: Team[] | string[];

  @Field(() => [Match], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }] })
  matches: Match[] | string[];

  @Field(() => Event, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Event' })
  event: string | Event;


  // @Field(() => Group, { nullable: true })
  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null })
  // parentGroup: string | Group | null;


  // @Field(() => [Group], { nullable: true })
  // @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }], default: [] })
  // childGroups: (string | Group)[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
export const GroupSchemaFactory = async () => {
  return GroupSchema;
};
