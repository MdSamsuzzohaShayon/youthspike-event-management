import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Match } from 'src/match/match.schema';
import { Player } from 'src/player/player.schema';
import { AppDocument } from 'src/shared/schema/document.schema';

@ObjectType()
@Schema({ timestamps: true })
export class PlayerStats extends AppDocument {
  @Field(() => Int)
  @Prop({ default: 0 })
  serveOpportunity: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  serveAce: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  serveCompletionCount: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  servingAceNoTouch: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  receiverOpportunity: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  receivedCount: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  noTouchAcedCount: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  hittingOpportunity: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  hittingCompletion: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  cleanHits: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  defensiveOpportunity: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  defensiveConversion: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  break: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  broken: number;

  @Field(() => Int)
  @Prop({ default: 0 })
  matchPlayed: number;

  @Field(() => Match, { nullable: true })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true })
  match: string | Match;

  @Field(() => Player, { nullable: true })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true })
  player: string | Player;
}

export const PlayerStatsSchema = SchemaFactory.createForClass(PlayerStats);
export const PlayerStatsSchemaFactory = async () => {
  return PlayerStatsSchema;
};



/*

/**
 * Database fields   for each player in a match
 * 1. Serve Opportunity (number) -> this will change for "Double Fault"
 * 2. Serve Ace (number) -> This will increase for "Ace No Touch" button
 * 3. Serve Completion Count (number) -> This will increase for "Ace No Touch" button
 * 4. Serving Ace No Touch 
 * 5. Receiver Opporitunity
 * 6. Received count
 * 7. No touch Aced Count
 * 8. Hitting opporitunity
 * 9. Hitting Completion
 * 10. Cleans hit
 * 11. Defensive opporitunity
 * 12. Defensive conversion
 * 13. Break
 * 14. Broken
 * 15. Match played
 * -----> Related fields
 * 16. match
 * 17. player
 * 
 * */


