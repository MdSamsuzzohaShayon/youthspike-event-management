import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';
import { Event } from 'src/event/event.schema';
import mongoose from 'mongoose';
import { Player } from 'src/player/player.schema';

export enum EEmailsenderFor {
  'TEAM' = 'TEAM',
  'EVENT' = 'EVENT',
}

registerEnumType(EEmailsenderFor, {
  name: 'EEmailsenderFor',
});

@Schema({timestamps: true})
@ObjectType()
export class Emailsender extends AppDocument {

  @Field((_type) => String)
  @Prop({ required: true })
  timestamp: string;

  @Field((_type) => EEmailsenderFor)
  @Prop({ required: true })
  sentfor: EEmailsenderFor;

  @Field((_type) => Event, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Event' })
  event: string | Event;

  @Field((_type) => [Emailcontent], { nullable: true })
  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Emailcontent' }] })
  emailcontents: string[] | Emailcontent[];

  // @Field((_type) => Team, { nullable: true })
  // @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Team' })
  // team?: string | Team;


}

@Schema()
@ObjectType()
export class Emailcontent extends AppDocument {

  @Field((_type) => String)
  @Prop({ required: true })
  subject: string;

  @Field((_type) => String)
  @Prop({ required: true })
  content: string; // email template

  @Field((_type) => Player, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  player: string | Player;

  @Field((_type) => Team, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Team' })
  team: string | Team;

  @Field((_type) => Emailsender, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Emailsender' })
  emailsender: string | Emailsender;

  @Field((_type) => String, {nullable: true})
  @Prop({ required: true })
  senttime: string;

}

export const EmailsenderSchema = SchemaFactory.createForClass(Emailsender);

// Create single index 
EmailsenderSchema.index({events: 1});


export const EmailsenderSchemaFactory = async () => {
  return EmailsenderSchema;
};

export const EmailcontentSchema = SchemaFactory.createForClass(Emailcontent);



export const EmailcontentSchemaFactory = async () => {
  return EmailcontentSchema;
};
