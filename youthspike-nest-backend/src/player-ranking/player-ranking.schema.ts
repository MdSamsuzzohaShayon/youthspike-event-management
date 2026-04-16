import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Match } from 'src/match/match.schema';
import { Player } from 'src/player/player.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';
import { Event } from 'src/event/event.schema';

@ObjectType()
@Schema()
export class PlayerRankingItem extends AppDocument {
  @Field((_type) => Int)
  @Prop({ required: true, default: null })
  rank: number | null;

  @Field((_type) => Player)
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  player: string | Player;

  @Field((_type) => PlayerRanking)
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'PlayerRanking' })
  playerRanking: string | PlayerRanking;
}


// Make clone for a match
@ObjectType()
@Schema()
export class PlayerRanking extends AppDocument {
  @Field((_type) => Int)
  @Prop({ required: true, default: false })
  rankLock: boolean;

  @Field((_type) => [PlayerRankingItem], { nullable: true })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlayerRankingItem' }] })
  rankings: PlayerRankingItem[] | string[];

  // Make relationship with team(not nullable) and match
  // One to many relationship with team
  @Field((_type) => Team)
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Team' })
  team: string | Team;

  @Field((_type) => Match, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Match' })
  match?: string | Match;

}

const PlayerRankingItemSchema = SchemaFactory.createForClass(PlayerRankingItem);
export const PlayerRankingItemSchemaFactory = async ()=>{
  return PlayerRankingItemSchema;
}

export const PlayerRankingSchema = SchemaFactory.createForClass(PlayerRanking);
export const PlayerRankingSchemaFactory = async () => {
  return PlayerRankingSchema;
};
