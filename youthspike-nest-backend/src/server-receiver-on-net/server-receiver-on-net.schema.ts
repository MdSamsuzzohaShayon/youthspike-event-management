import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Match } from 'src/match/match.schema';
import { Net } from 'src/net/net.schema';
import { Player } from 'src/player/player.schema';
import { Round } from 'src/round/round.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Event } from 'src/event/event.schema';


export enum EServerPositionPair {
  'PAIR_A_TOP' = 'PAIR_A_TOP',
  'PAIR_A_LEFT' = 'PAIR_A_LEFT',

  'PAIR_B_BOTTOM' = 'PAIR_B_BOTTOM',
  'PAIR_B_RIGHT' = 'PAIR_B_RIGHT',
}

export enum EServerReceiverAction {
  SERVER_ACE_NO_TOUCH = 'SERVER_ACE_NO_TOUCH',
  SERVER_ACE_NO_THIRD_TOUCH = 'SERVER_ACE_NO_THIRD_TOUCH',
  SERVER_RECEIVING_HITTING_ERROR = 'SERVER_RECEIVING_HITTING_ERROR',
  SERVER_DEFENSIVE_CONVERSION = 'SERVER_DEFENSIVE_CONVERSION',
  SERVER_DO_NOT_KNOW = 'SERVER_DO_NOT_KNOW',

  RECEIVER_SERVICE_FAULT = 'RECEIVER_SERVICE_FAULT',
  RECEIVER_ONE_TWO_THREE_PUT_AWAY = 'RECEIVER_ONE_TWO_THREE_PUT_AWAY',
  RECEIVER_RALLEY_CONVERSION = 'RECEIVER_RALLEY_CONVERSION',
  RECEIVER_DO_NOT_KNOW = 'RECEIVER_DO_NOT_KNOW',
}

registerEnumType(EServerPositionPair, {
  name: 'EServerPositionPair',
});

registerEnumType(EServerReceiverAction, {
  name: 'EServerReceiverAction',
});



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


  @Field((_type) => EServerPositionPair, { nullable: false })
  @Prop({ required: true })
  serverPositionPair: EServerPositionPair


  
  @Field((_type) => Net, { nullable: false })
  @Prop({ required: true, immutable: true, type: mongoose.Schema.Types.ObjectId, ref: 'Net' })
  net: string | Net;

  @Field((_type) => Event, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Event' })
  event: Event | string;

  @Field((_type) => String, { nullable: true })
  netId?: string;

  @Field({ nullable: true})
  @Prop({ required: false })
  teamAScore: number | null;

  @Field({ nullable: false})
  @Prop({ required: false })
  teamBScore: number | null;


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
}

@ObjectType()
@Schema({ timestamps: true })
export class ServerReceiverSinglePlay extends ServerReceiverCommon {

  @Field((_type) => EServerReceiverAction, { nullable: false })
  @Prop({ required: true, default: EServerReceiverAction.SERVER_DO_NOT_KNOW })
  action: EServerReceiverAction; // Which button has been pressen
}

export const ServerReceiverOnNetSchema = SchemaFactory.createForClass(ServerReceiverOnNet);
ServerReceiverOnNetSchema.index({event: 1});
export const ServerReceiverOnNetSchemaFactory = async () => {
  return ServerReceiverOnNetSchema;
};

export const ServerReceiverSinglePlaySchema = SchemaFactory.createForClass(ServerReceiverSinglePlay);
ServerReceiverSinglePlaySchema.index({event: 1});
export const ServerReceiverSinglePlaySchemaFactory = async () => {
  return ServerReceiverSinglePlaySchema;
};
