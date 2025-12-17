import { Field, InputType, Int, ObjectType, PartialType } from '@nestjs/graphql';
import { EPlayerStatus } from '../player.schema';
import { FileUpload } from 'graphql-upload/processRequest.mjs';
import * as GraphQLUploadModule from 'graphql-upload/GraphQLUpload.mjs';
const GraphQLUpload = GraphQLUploadModule.default;

@InputType()
export class CreatePlayerInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  username?: string;

  @Field()
  event: string;

  @Field()
  division: string;

  @Field({ nullable: true })
  email: string;

  @Field({ nullable: true })
  phone: string;


  @Field({ nullable: true })
  team?: string;
}

@InputType()
export class UpdatePlayerInput extends PartialType(CreatePlayerInput) {
  @Field({ nullable: true })
  status?: EPlayerStatus;

  @Field({ nullable: true })
  newTeamId: string;
}

@InputType()
export class UpdatePlayersInput extends PartialType(CreatePlayerInput) {
  @Field()
  _id: string;

  @Field({ nullable: true })
  status?: EPlayerStatus;
}


@InputType()
export class CreatePlayerBody{
  @Field()
  input: CreatePlayerInput;
  
  @Field((_type)=> GraphQLUpload, {nullable: true})
  profile?: Promise<FileUpload>;
}

@InputType()
export class CreateMultiPlayerBody{
  @Field()
  eventId: string;

  @Field()
  division: string;
  
  @Field((_type)=> GraphQLUpload)
  uploadedFile: Promise<FileUpload>;
}


@InputType()
export class UpdatePlayerBody{
  @Field()
  input: UpdatePlayerInput;

  @Field()
  playerId: string;
  
  @Field((_type)=> GraphQLUpload, {nullable: true})
  profile?: Promise<FileUpload>;
}


export enum EGroupType{
  OVERALL = "OVERALL",
  CONFERENCE = "CONFERENCE",
  NON_CONFERENCE = "NON_CONFERENCE",
}


@InputType()
export class PlayerSearchFilter {
  @Field({ nullable: true })
  ce?: EGroupType; // team, description, location
  
  @Field({ nullable: true })
  search?: string; // team, description, location

  @Field({ nullable: true })
  division?: string; // 

  @Field({ nullable: true })
  group?: string;

  @Field(() => Int, { nullable: true, defaultValue: 30 })
  limit?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  offset?: number;
}

