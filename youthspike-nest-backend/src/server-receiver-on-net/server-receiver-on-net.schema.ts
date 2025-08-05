import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Match } from 'src/match/match.schema';
import { Net } from 'src/net/net.schema';
import { Player } from 'src/player/player.schema';
import { Round } from 'src/round/round.schema';
import { AppDocument } from 'src/shared/schema/document.schema';

// Recorded
@ObjectType()
@Schema({ timestamps: true })
export class ServerReceiverCommon extends AppDocument {
  @Field({ nullable: false })
  @Prop({ required: true, default: 0 })
  play: number; // current mutate -> permanent in the single play

  // Relationships
  @Field((_type) => Match, { nullable: false })
  @Prop({ required: true, immutable: true, type: mongoose.Schema.Types.ObjectId, ref: 'Match' })
  match: string | Match;

  @Field((_type) => String, { nullable: true })
  matchId?: string;


  // Relations with players
  @Field((_type) => Player, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  server: string | Player;

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


  
  @Field((_type) => Net, { nullable: false })
  @Prop({ required: true, immutable: true, type: mongoose.Schema.Types.ObjectId, ref: 'Net' })
  net: string | Net;

  @Field((_type) => String, { nullable: true })
  netId?: string;
}

// Current
@ObjectType()
@Schema({ timestamps: true })
export class ServerReceiverOnNet extends ServerReceiverCommon {

  @Field({ nullable: false })
  @Prop({ required: true, default: 0 })
  mutate: number; // Total mutation

  // Relationships
  @Field({ nullable: false })
  @Prop({ required: true })
  room: string;

  @Field((_type) => Round, { nullable: false })
  @Prop({ required: true, immutable: true, type: mongoose.Schema.Types.ObjectId, ref: 'Round' })
  round: string | Round;

  @Field((_type) => String, { nullable: true })
  roundId?: string;

  // Only for GraphQL / Not for MongoDB
  @Field({ nullable: true })
  teamAScore: number | null;

  @Field({ nullable: true })
  teamBScore: number | null;
}

@ObjectType()
@Schema({ timestamps: true })
export class ServerReceiverSinglePlay extends ServerReceiverCommon {
  @Field({ nullable: true})
  @Prop({ required: false })
  teamAScore: number | null;

  @Field({ nullable: false})
  @Prop({ required: false })
  teamBScore: number | null;
}

export const ServerReceiverOnNetSchema = SchemaFactory.createForClass(ServerReceiverOnNet);
export const ServerReceiverOnNetSchemaFactory = async () => {
  return ServerReceiverOnNetSchema;
};

export const ServerReceiverSinglePlaySchema = SchemaFactory.createForClass(ServerReceiverSinglePlay);
export const ServerReceiverSinglePlaySchemaFactory = async () => {
  return ServerReceiverSinglePlaySchema;
};
