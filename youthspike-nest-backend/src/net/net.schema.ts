/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Match } from 'src/match/match.schema';
import { Player } from 'src/player/player.schema';
import { Round } from 'src/round/round.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';

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

  @Field((type) => ServerReceiverOnNet, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'ServerReceiverOnNet' })
  serverReceiverOnNet?: ServerReceiverOnNet | string;

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

  @Field((type) => ETieBreaker, { nullable: true })
  @Prop({ required: false, default: ETieBreaker.PREV_NET })
  netType: ETieBreaker;

  @Field((type) => Int, { nullable: true })
  @Prop({ required: false, min: 0, default: null })
  teamAScore: number;

  @Field((type) => Int, { nullable: true })
  @Prop({ required: false, min: 0, default: null })
  teamBScore: number;

  @Field((type) => Int)
  @Prop({ required: false, min: 0, default: 0 })
  pairRange?: number;
}

@ObjectType()
@Schema({ timestamps: true })
export class ServerReceiverOnNet extends AppDocument {
  @Field({ nullable: false })
  @Prop({ required: true, default: 0 })
  mutate: number;

  // Relationships
  @Field((_type) => Player, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  server: string | Player;

  // @Field(() => String, { nullable: true, description: 'ID of the server player' })
  // get serverId(): string | null {
  //   if (!this.server) return null;
  //   return typeof this.server === 'string' ? this.server : this.server._id.toString();
  // }
  @Field((_type) => String, { nullable: true })
  serverId?: string;


  @Field((_type) => Player, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  servingPartner: string | Player;

  @Field((_type) => String, { nullable: true })
  servingPartnerId?: string;

  @Field((_type) => Player, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  receiver: string | Player;

  @Field((_type) => String, { nullable: true })
  receiverId?: string;

  @Field((_type) => Player, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  receivingPartner: string | Player;

  @Field((_type) => String, { nullable: true })
  receivingPartnerId?: string;

  @Field({ nullable: false })
  @Prop({ required: true })
  room: string;

  @Field((_type) => Match, { nullable: false })
  @Prop({ required: true, immutable: true, type: mongoose.Schema.Types.ObjectId, ref: 'Match' })
  match: string | Match;

  @Field((_type) => String, { nullable: true })
  matchId?: string;

  @Field((_type) => Net, { nullable: false })
  @Prop({ required: true, immutable: true, type: mongoose.Schema.Types.ObjectId, ref: 'Net' })
  net: string | Net;

  @Field((_type) => String, { nullable: true })
  netId?: string;

  @Field((_type) => Round, { nullable: false })
  @Prop({ required: true, immutable: true, type: mongoose.Schema.Types.ObjectId, ref: 'Round' })
  round: string | Round;

  @Field((_type) => String, { nullable: true })
  roundId?: string;

  @Field({ nullable: false, defaultValue: 0 })
  teamAScore: number;

  @Field({ nullable: false, defaultValue: 0 })
  teamBScore: number;
}

// ServerReceiverOnNet
export const ServerReceiverOnNetSchema = SchemaFactory.createForClass(ServerReceiverOnNet);
export const ServerReceiverOnNetSchemaFactory = async () => {
  return ServerReceiverOnNetSchema;
};

export const NetSchema = SchemaFactory.createForClass(Net);
export const NetSchemaFactory = async () => {
  return NetSchema;
};
