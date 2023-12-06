/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Match } from 'src/match/match.schema';
import { Net } from 'src/net/net.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Sub } from 'src/sub/sub.schema';
import { Team } from 'src/team/team.schema';

/**
 * Round
 */
@ObjectType()
@Schema({ timestamps: true })
export class Round extends AppDocument {
  @Field((type) => Match, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Match' })
  match: string | Match;

  @Field((type) => Int)
  @Prop({ required: true, default: 1 })
  num: number;

  @Field((type) => [Net], { nullable: true })
  nets?: Net[] | string[];

  @Field((type) => Sub, { nullable: true })
  sub?: Sub | string;

  // @Field((type) => Int, { nullable: true })
  // teamAScore?: number;

  // @Field((type) => Int, { nullable: true })
  // teamBScore?: number;
}

export const RoundSchema = SchemaFactory.createForClass(Round);
export const RoundSchemaFactory = async () => {
  return RoundSchema;
};
