import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Event } from 'src/event/event.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';
import { User } from 'src/user/user.schema';


export enum EPlayerStatus{
  'ACTIVE' = 'ACTIVE',
  'INACTIVE' = 'INACTIVE',
}

registerEnumType(EPlayerStatus, {
  name: "EPlayerStatus"
})

@Schema()
@ObjectType()
export class Player extends AppDocument {
  @Field((_type) => String)
  @Prop({ required: true })
  firstName: string;

  @Field((_type) => String)
  @Prop({ required: true })
  lastName: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  email?: string | null;

  @Field((_types)=> EPlayerStatus, {nullable: false})
  @Prop({required: true, enum: EPlayerStatus, default: EPlayerStatus.ACTIVE})
  status: EPlayerStatus

  @Field((_type) => Int, { nullable: true })
  @Prop({ required: false })
  rank?: number;

  @Prop({ required: false })
  @Field({ nullable: true })
  profile?: string;

  @Prop({ required: false })
  @Field({ nullable: true })
  phone?: string;

  @Prop({ required: true })
  @Field({ nullable: false })
  division: string;

  // @Prop({ required: false })
  // @Field({ nullable: true })
  // division?: string;

  /**
   * Relatives
   */
  @Field((_type) => [Event], { nullable: true })
  @Prop({ required: false, type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Event'}] })
  events?: Event[] | string[];

  @Field(() => [Team], { nullable: true })
  @Prop({ required: false, type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Team'}] })
  teams?: Team[] | string[];

  // Create a user itself for captain of an event and make relation with event
  @Field((_type) => [Team], { nullable: true })
  @Prop({ required: false, type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Team'}] })
  captainofteams?: Team[] | string[];

  @Field((_type) => [Team], { nullable: true })
  @Prop({ required: false, type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Team'}] })
  cocaptainofteams?: Team[] | string[];

  // User to login as captain
  @Field((_type) => User, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  captainuser?: User | string;

  @Field((_type) => User, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  cocaptainuser?: User | string;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
export const PlayerSchemaFactory = async () => {
  return PlayerSchema;
};
