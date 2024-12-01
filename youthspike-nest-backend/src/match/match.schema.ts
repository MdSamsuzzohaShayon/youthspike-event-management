import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Event } from 'src/event/event.schema';
import { Group } from 'src/group/group.schema';
import { Net } from 'src/net/net.schema';
import { PlayerRanking } from 'src/player-ranking/player-ranking.schema';
import { Room } from 'src/room/room.schema';
import { Round } from 'src/round/round.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';

/**
 * Matchs
 */
@ObjectType()
@Schema({ timestamps: true })
export class Match extends AppDocument {
  @Field((_type) => String)
  @Prop({ required: true })
  date: string;

  // Default properties
  @Field({ nullable: false })
  @Prop({ required: true })
  division: string;

  @Field((_type) => Int)
  @Prop({ required: false })
  numberOfNets?: number;

  @Field((_type) => Int)
  @Prop({ required: false })
  numberOfRounds?: number;

  @Field({ nullable: true })
  @Prop({ required: false })
  netVariance?: number;

  @Field({ nullable: true })
  @Prop({ required: false })
  homeTeam?: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  autoAssign?: boolean;

  @Field({ nullable: true })
  @Prop({ required: false })
  autoAssignLogic?: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  rosterLock?: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  timeout?: number;

  @Field({ nullable: true })
  @Prop({ required: false })
  description?: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  fwango?: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  completed: boolean;

  // Relations
  @Field((_type) => Event, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Event' })
  event: string | Event;

  @Field((_type) => [Net], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Net' }] })
  nets: Net[] | string[];

  @Field((_type) => [Round], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Round' }] })
  rounds: Round[] | string[];

  @Field((_type) => Team, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Team' })
  teamA?: string | Team;

  @Field((_type) => Team, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Team' })
  teamB?: string | Team;

  @Field((_type) => Room, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Room' })
  room?: Room | string;

  @Field((_type) => PlayerRanking, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'PlayerRanking' })
  teamARanking?: PlayerRanking | string;

  @Field((_type) => PlayerRanking, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'PlayerRanking' })
  teamBRanking?: PlayerRanking | string;

  @Field((type) => Group, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Group' })
  group?: Group | string;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
export const MatchSchemaFactory = async () => {
  return MatchSchema;
};
