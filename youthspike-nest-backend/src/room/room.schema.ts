import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Match } from 'src/match/match.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';



@Schema()
@ObjectType()
export class Room extends AppDocument {
  // @Field((_type) => String, { nullable: true })
  // @Prop({ required: false })
  // socketRoomId?: string;
  
  @Field((_type) => Team, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Team' })
  teamA: Team | string;

  @Field((_type) => Team, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Team' })
  teamB: Team | string;

  @Field((type) => Match, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Match' })
  match?: Match | string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
export const RoomSchemaFactory = async () => {
  return RoomSchema;
};
