import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Event } from 'src/event/event.schema';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import {
  ServerReceiverOnNet,
  ServerReceiverSinglePlay,
} from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';
import { User } from 'src/user/user.schema';

export enum EPlayerStatus {
  'ACTIVE' = 'ACTIVE',
  'INACTIVE' = 'INACTIVE',
}



registerEnumType(EPlayerStatus, {
  name: 'EPlayerStatus',
});

@Schema()
@ObjectType()
export class Player extends AppDocument {
  @Field((_type) => String)
  @Prop({ required: true })
  firstName: string;

  @Field((_type) => String)
  @Prop({ required: true })
  lastName: string;

  @Field((_type) => String, { nullable: false })
  @Prop({ required: true })
  name: string;

  @Field((_type) => String, { nullable: false })
  @Prop({ required: true, unique: true })
  username: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  email?: string | null;

  @Field((_types) => EPlayerStatus, { nullable: false })
  @Prop({ required: true, enum: EPlayerStatus, default: EPlayerStatus.ACTIVE })
  status: EPlayerStatus;

  @Prop({ required: false })
  @Field({ nullable: true })
  profile?: string;

  @Prop({ required: false })
  @Field({ nullable: true })
  phone?: string;

  @Prop({ required: true })
  @Field({ nullable: false })
  division: string;

  /**
   * Relatives
   */
  @Field((_type) => [Event], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }] })
  events?: Event[] | string[];

  @Field(() => [Team], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }] })
  teams?: Team[] | string[];

  @Field(() => [Team], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }] })
  prevteams?: Team[] | string[];

  // Create a user itself for captain of an event and make relation with event
  @Field((_type) => [Team], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }] })
  captainofteams?: Team[] | string[];

  @Field((_type) => [Team], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }] })
  cocaptainofteams?: Team[] | string[];

  // User to login as captain
  @Field((_type) => User, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  captainuser?: User | string;

  @Field((_type) => User, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  cocaptainuser?: User | string;

  // Check stats of all matches
  @Field((_type) => [PlayerStats], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlayerStats' }] })
  playerstats?: PlayerStats[] | string[];

  // Current
  @Field((_type) => [ServerReceiverOnNet], { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'ServerReceiverOnNet' })
  serverReceiverOnNet?: ServerReceiverOnNet[] | string[];

  // Each iteam
  @Field((_type) => [ServerReceiverSinglePlay], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServerReceiverSinglePlay' }] })
  serverReceiverSinglePlay?: ServerReceiverSinglePlay[] | string[];
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
export const PlayerSchemaFactory = async () => {
  return PlayerSchema;
};
