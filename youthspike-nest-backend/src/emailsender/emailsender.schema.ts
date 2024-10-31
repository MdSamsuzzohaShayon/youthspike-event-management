/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';

/**
 * EmailSender
 * https://docs.nestjs.com/techniques/mongodb#model-injection
 * https://docs.nestjs.com/graphql/resolvers#object-types
 */
@ObjectType()
@Schema({ timestamps: true })
export class EmailSenderTemplate extends AppDocument {
  /**
   * Base properties
   */

  @Field(() => Team, { nullable: false })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Team.name })
  team: string | Team;

  @Field()
  @Prop({ required: true })
  subject: string;

  @Field()
  @Prop({ required: true })
  template: string;

  @Field({ defaultValue: new Date().toISOString() })
  @Prop({ required: true, default: new Date().toISOString() })
  send_date: string;
}

export const EmailSenderTemplateSchema = SchemaFactory.createForClass(EmailSenderTemplate);
export const EmailSenderTemplateSchemaFactory = async () => {
  return EmailSenderTemplateSchema;
};
