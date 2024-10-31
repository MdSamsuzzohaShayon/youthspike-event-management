/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Match } from 'src/match/match.schema';
import { Net } from 'src/net/net.schema';
import { Player } from 'src/player/player.schema';
import { AppDocument } from 'src/shared/schema/document.schema';

export enum EActionProcess {
  INITIATE = 'INITIATE',

  CHECKIN = 'CHECKIN',

  LINEUP = 'LINEUP',
  LINEUP_SUBMITTED = 'LINEUP_SUBMITTED',

  LOCKED = 'LOCKED',
  COMPLETED = 'COMPLETED',
}

export enum ETeam {
  teamA = 'teamA',
  teamB = 'teamB',
}

registerEnumType(EActionProcess, {
  name: 'EActionProcess',
});

registerEnumType(ETeam, {
  name: 'ETeam',
});

/**
 * Round
 */
@ObjectType()
@Schema({ timestamps: true })
export class Round extends AppDocument {
  @Field((type) => Int)
  @Prop({ required: true, default: 1 })
  num: number;

  @Field((type) => Match, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Match' })
  match: string | Match;

  @Field((type) => [Net], { nullable: true })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Net' }] })
  nets?: Net[] | string[];

  // Only one relations
  @Field((type) => [Player], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }] })
  players?: Player[] | string[];

  // Only one relations
  @Field((type) => [Player], { nullable: true })
  @Prop({ required: false, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }] })
  subs?: Player[] | string[];

  @Field((type) => Int, { nullable: true })
  @Prop({ required: false })
  teamAScore?: number;

  @Field((type) => Int, { nullable: true })
  @Prop({ required: false })
  teamBScore?: number;

  @Field((type) => EActionProcess, { nullable: false })
  @Prop({ required: true, type: String, default: EActionProcess.INITIATE, enum: EActionProcess })
  teamAProcess: EActionProcess;

  @Field((type) => EActionProcess, { nullable: false })
  @Prop({ required: true, type: String, default: EActionProcess.INITIATE, enum: EActionProcess })
  teamBProcess: EActionProcess;

  @Field((type) => Boolean, { nullable: true })
  @Prop({ required: false, default: false })
  completed: boolean;

  @Field((type) => ETeam, { nullable: false })
  @Prop({ required: true, type: String, enum: ETeam })
  firstPlacing: ETeam;
}

export const RoundSchema = SchemaFactory.createForClass(Round);
export const RoundSchemaFactory = async () => {
  return RoundSchema;
};
