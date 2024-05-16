/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { LDO } from 'src/ldo/ldo.schema';
import { Match } from 'src/match/match.schema';
import { Player } from 'src/player/player.schema';
import { DateScalar } from 'src/shared/date-scaler';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Sponsor } from 'src/sponsor/sponsor.schema';
import { Team } from 'src/team/team.schema';

/**
 * Event
 * https://docs.nestjs.com/techniques/mongodb#model-injection
 * https://docs.nestjs.com/graphql/resolvers#object-types
 */
@ObjectType()
@Schema({ timestamps: true })
export class Event extends AppDocument {
  /**
   * Base properties
   */
  @Field()
  @Prop({ required: true })
  name: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  logo?: string;

  @Field((type) => DateScalar)
  @Prop({ required: true, default: new Date() })
  startDate: Date;

  @Field((type) => DateScalar)
  @Prop({ required: true, default: new Date() })
  endDate: Date;

  @Field()
  @Prop({ required: true })
  active: boolean;

  @Field({ nullable: true })
  @Prop({ required: false, default: false })
  sendCredentials: boolean;

  @Field((type) => Int)
  @Prop({ required: true })
  playerLimit?: number;

  // fwango
  @Field({ nullable: true })
  @Prop({ required: false, })
  fwango?: string;

  /**
   * Database Relationship
   */
  @Field(() => LDO, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: LDO.name })
  ldo: string | LDO;

  @Field(() => [Player], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }] })
  players: Player[] | string[];

  @Field(() => [Team], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }] })
  teams: Team[] | string[];

  @Field(() => [Match], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }] })
  matches: Match[] | string[];

  @Field(() => [Sponsor], { nullable: false })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' }] })
  sponsors: Sponsor[] | string[];

  /**
   * Default properties for match
   */
  @Field({ nullable: false })
  @Prop({ required: true })
  divisions: string;

  @Field({ nullable: false })
  @Prop({ required: true })
  nets: number;

  @Field({ nullable: false })
  @Prop({ required: true })
  rounds: number;

  @Field({ nullable: false })
  @Prop({ required: true })
  netVariance: number;

  @Field({ nullable: false })
  @Prop({ required: true })
  homeTeam: string;

  @Field({ nullable: false })
  @Prop({ required: true })
  autoAssign: boolean;

  @Field({ nullable: false })
  @Prop({ required: true })
  autoAssignLogic: string;

  @Field({ nullable: false })
  @Prop({ required: true })
  rosterLock: string;

  @Field({ nullable: false })
  @Prop({ required: true })
  timeout: number;

  @Field({ nullable: false })
  @Prop({ required: true })
  coachPassword: string;

  @Field({ nullable: true })
  @Prop({ required: true })
  description: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
export const EventSchemaFactory = async () => {
  return EventSchema;
};
