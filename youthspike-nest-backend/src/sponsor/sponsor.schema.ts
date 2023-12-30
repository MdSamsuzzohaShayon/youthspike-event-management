import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Event } from "src/event/event.schema";
import { AppDocument } from "src/shared/schema/document.schema";


@ObjectType()
@Schema()
export class Sponsor extends AppDocument {
  @Field((_type) => String, { nullable: false })
  @Prop({ required: true })
  company: string;

  @Field((_type) => String, { nullable: false })
  @Prop({ required: true })
  logo: string;

  @Field(() => Event, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Event' })
  event?: string | Event;
}


export const SponsorSchema = SchemaFactory.createForClass(Sponsor);
export const SponsorSchemaFactory = async () => {
  return SponsorSchema;
};