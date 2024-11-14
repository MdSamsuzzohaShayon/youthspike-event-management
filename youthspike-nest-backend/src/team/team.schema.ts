/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Event } from 'src/event/event.schema';
import { Group } from 'src/group/group.schema';
import { Match } from 'src/match/match.schema';
import { Net } from 'src/net/net.schema';
import { PlayerRanking } from 'src/player-ranking/player-ranking.schema';
import { Player } from 'src/player/player.schema';
import { AppDocument } from 'src/shared/schema/document.schema';

/**
 * Event
 */
@ObjectType()
@Schema({ timestamps: true })
export class Team extends AppDocument {
  @Field()
  @Prop({ required: true })
  name: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  logo: string;

  @Field({ nullable: false })
  @Prop({ required: true })
  active: boolean;

  @Field({ nullable: false })
  @Prop({ required: true })
  division: string;

  @Field((_type) => Boolean, { nullable: true, defaultValue: false })
  @Prop({ required: false, default: false })
  rankLock: boolean;

  @Field({ nullable: true })
  @Prop({ required: false, default: false })
  sendCredentials: boolean;

  @Field({ nullable: true })
  @Prop({ required: false })
  num?: number;

  /**
   * Relations
   */
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  @Field((type) => Player, { nullable: true })
  captain?: Player | string; // Make the captain field nullable

  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  @Field((type) => Player, { nullable: true })
  cocaptain?: Player | string; // Make the captain field nullable

  @Field((type) => [Match], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }] })
  matches?: Match[] | string[]; // Make the captain field nullable

  @Field((type) => Event, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Event' })
  event: Event | string;

  @Field(() => [Player], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }] })
  players?: Player[] | string[]; // Update the type of players to allow null values

  @Field(() => [Net], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Net' }] })
  nets?: Net[] | string[]; // Update the type of Nets to allow null values

  @Field((type) => [PlayerRanking], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlayerRanking' }] })
  playerRankings?: PlayerRanking[] | string[];

  @Field((type) => Group, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Group' })
  group?: Group | string;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
export const TeamSchemaFactory = async () => {
  return TeamSchema;
};
