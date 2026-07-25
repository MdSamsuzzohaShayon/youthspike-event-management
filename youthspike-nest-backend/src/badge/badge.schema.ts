import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';
import { Event } from 'src/event/event.schema';
import mongoose from 'mongoose';
import { Player } from 'src/player/player.schema';


@Schema({ timestamps: true })
@ObjectType()
export class Badge extends AppDocument {

  @Field((_type) => String)
  @Prop({ required: true })
  name: string;

  @Field((_type) => String)
  @Prop({ required: true })
  icon: string;

  @Field((_type) => Event, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Event' })
  event: string | Event;

  @Field((_type) => [Team], { nullable: true })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }] })
  teams: string[] | Team[];


  @Field((_type) => [Player], { nullable: true })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }] })
  players: string[] | Player[];

}


export const BadgeSchema = SchemaFactory.createForClass(Badge);

// Create single index 
BadgeSchema.index({ name: 1 });


export const BadgeSchemaFactory = async () => {
  return BadgeSchema;
};
