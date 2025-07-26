import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Match } from "src/match/match.schema";
import { Net } from "src/net/net.schema";
import { Player } from "src/player/player.schema";
import { Round } from "src/round/round.schema";
import { AppDocument } from "src/shared/schema/document.schema";

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