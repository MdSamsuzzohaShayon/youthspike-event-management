/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Match } from 'src/match/match.schema';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { Round } from 'src/round/round.schema';
import { ServerReceiverOnNet, ServerReceiverSinglePlay } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { AppDocument } from 'src/shared/schema/document.schema';

export enum ETieBreaker {
  PREV_NET = 'PREV_NET',
  FINAL_ROUND_NET = 'FINAL_ROUND_NET',
  FINAL_ROUND_NET_LOCKED = 'FINAL_ROUND_NET_LOCKED',
  TIE_BREAKER_NET = 'TIE_BREAKER_NET', // There will be only one tie breaker net in a round
}

registerEnumType(ETieBreaker, {
  name: 'ETieBreaker',
});

/**
 * Round
 */
@ObjectType()
@Schema({ timestamps: true })
export class Net extends AppDocument {
  @Field((type) => Int, { nullable: true })
  @Prop({ required: true, default: 1 })
  num: number;

  /**
   * Relationship
   */
  @Field((_type) => Match, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Match' })
  match: string | Match;

  @Field((_type) => Round, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Round' })
  round: Round | string;


  @Field((_type) => ServerReceiverOnNet, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'ServerReceiverOnNet' })
  serverReceiverOnNet?: ServerReceiverOnNet | string;

  @Field((_type) => [ServerReceiverSinglePlay], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServerReceiverSinglePlay' }] })
  serverReceiverSinglePlay?: ServerReceiverSinglePlay[] | string[];

  @Field((_type) => [PlayerStats], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlayerStats' }] })
  playerstats?: PlayerStats[] | string[];

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
  @Field((_type) => Int, { nullable: false })
  @Prop({ required: true, min: 1, max: 2, default: 1 })
  points: number;

  @Field((_type) => ETieBreaker, { nullable: true })
  @Prop({ required: false, default: ETieBreaker.PREV_NET })
  netType: ETieBreaker;

  @Field((_type) => Int, { nullable: true })
  @Prop({ required: false, min: 0, default: null })
  teamAScore: number;

  @Field((_type) => Int, { nullable: true })
  @Prop({ required: false, min: 0, default: null })
  teamBScore: number;

  @Field((_type) => Int)
  @Prop({ required: false, min: 0, default: 0 })
  pairRange?: number;

  @Field(() => String, { nullable: true })
  @Prop({ required: false })
  streamUrl?: string;
}


export const NetSchema = SchemaFactory.createForClass(Net);
export const NetSchemaFactory = async () => {
  return NetSchema;
};
