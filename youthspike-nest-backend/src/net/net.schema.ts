/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Match } from 'src/match/match.schema';
import { Player } from 'src/player/player.schema';
import { Round } from 'src/round/round.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';
import { User } from 'src/user/user.schema';

/**
 * Round
 */
@ObjectType()
@Schema({ timestamps: true })
export class Net extends AppDocument {
  
  
  @Field((type) => Int)
  @Prop({ required: true, default: 1 })
  num?: number;


  /**
   * Relationship
   */
  @Field((type) => Match, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Match' })
  match: string | Match;

  @Field((type) => Round, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Round' })
  round: Round | string;

  @Field((type) => Team, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Team' })
  teamA?: Team | string;

  @Field((type) => Team, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Team' })
  teamB?: Team | string;


  /**
   * A team will have many players, In each net captain will choose 2 player to play on their net
   */
  @Field(() => String, { nullable: true })
  @Prop({ required: false })
  teamAPlayerA?: string;

  @Field(() => String, { nullable: true })
  @Prop({ required: false })
  teamAPlayerB?: string;

  @Field(() => String, { nullable: true })
  @Prop({ required: false })
  teamBPlayerA?: string;

  @Field(() => String, { nullable: true })
  @Prop({ required: false })
  teamBPlayerB?: string;

  /**
   * Points / Score / Stats
   */
  @Field((type) => Int, { nullable: false })
  @Prop({ required: true, min: 1, max: 2, default: 1 })
  points: number;

  @Field((type) => Int, { nullable: true })
  @Prop({ required: true, min: 0, default: 0 })
  teamAScore: number;

  @Field((type) => Int, { nullable: true })
  @Prop({ required: true, min: 0, default: 0 })
  teamBScore: number;

  @Field((type) => Int)
  @Prop({ required: false, min: 0, default: 0 })
  pairRange?: number;
}

export const NetSchema = SchemaFactory.createForClass(Net);
export const NetSchemaFactory = async () => {
  return NetSchema;
};
