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
  @Field((_type) => Player, { nullable: true })
  captain?: Player | string; // Make the captain field nullable

  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  @Field((_type) => Player, { nullable: true })
  cocaptain?: Player | string; // Make the captain field nullable

  @Field((type) => [Match], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }] })
  matches?: Match[] | string[]; // Make the captain field nullable

  @Field((_type) => [Event], { nullable: true })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }] })
  events?: Event[] | string[];

  @Field(() => [Player], { nullable: true })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }] })
  players?: Player[] | string[]; // Update the type of players to allow null values

  @Field(() => [Player], { nullable: true })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }] })
  moved?: Player[] | string[];


  @Field((_type) => [PlayerRanking], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlayerRanking' }] })
  playerRankings?: PlayerRanking[] | string[];


  @Field(() => [Group], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }] })
  groups: Group[] | string[];
}

export const TeamSchema = SchemaFactory.createForClass(Team);

// Create single index
TeamSchema.index({event: 1});
TeamSchema.index({name: 1});
TeamSchema.index({ event: 1, division: 1, group: 1 });
TeamSchema.index({ event: 1, name: 1 });

export const TeamSchemaFactory = async () => {
  return TeamSchema;
};


