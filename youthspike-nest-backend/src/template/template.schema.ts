import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Event } from 'src/event/event.schema';

export enum ETemplateType {
  PLAYER = "PLAYER",
  TEAM = "TEAM",
  EVENT = "EVENT",
}

registerEnumType(ETemplateType, {
  name: 'ETemplateType',
});



@ObjectType()
@Schema({ timestamps: true })
export class Template extends AppDocument {
  @Field()
  @Prop({ required: true })
  name: string;

  @Field(() => ETemplateType)
  @Prop({
    required: true,
    type: String,
    enum: ETemplateType,
    default: ETemplateType.PLAYER
  })
  type: ETemplateType;

  @Field()
  @Prop({ required: true })
  subject: string;

  @Field()
  @Prop({ required: true })
  body: string;

  @Field(() => [String], { nullable: true })
  @Prop({ type: [{ type: String }] })
  images?: string[];

  // Placeholders as simple array of strings
  @Field(() => [String], { nullable: true })
  @Prop({ type: [{ type: String }], default: [] })
  placeholders?: string[];


  @Field((_type) => Event, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Event' })
  event: Event | string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

// Simplified indexes
TemplateSchema.index({ event: 1 });
TemplateSchema.index({ name: 1 });

export const TemplateSchemaFactory = async () => {
  return TemplateSchema;
};