/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Group } from 'src/group/group.schema';
import { LDO } from 'src/ldo/ldo.schema';
import { Match } from 'src/match/match.schema';
import { Net } from 'src/net/net.schema';
import { Player } from 'src/player/player.schema';
import { PlayerRanking, PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';
import { PlayerStats, ProStats } from 'src/player-stats/player-stats.schema';
import { Room } from 'src/room/room.schema';
import { Round } from 'src/round/round.schema';
import { ServerReceiverOnNet, ServerReceiverSinglePlay } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { Sponsor } from 'src/sponsor/sponsor.schema';
import { Team } from 'src/team/team.schema';
import { Template } from 'src/template/template.schema';
import { User } from 'src/user/user.schema';
import { Event } from 'src/event/event.schema';

/**
 * Base Archive Schema
 * Adds archivedAt timestamp to all collections
 */
@ObjectType()
@Schema({ timestamps: true })
class BaseArchive extends AppDocument {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id

}

/* -------------------- Event Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveEvent extends Event {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id

}
export const ArchiveEventSchema = SchemaFactory.createForClass(ArchiveEvent);
export const ArchiveEventSchemaFactory = async () => ArchiveEventSchema;

/* -------------------- Group Archive -------------------- */ 
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveGroup extends Group {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id

}
export const ArchiveGroupSchema = SchemaFactory.createForClass(ArchiveGroup);
export const ArchiveGroupSchemaFactory = async () => ArchiveGroupSchema;

/* -------------------- LDO Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveLDO extends LDO {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveLDOSchema = SchemaFactory.createForClass(ArchiveLDO);
export const ArchiveLDOSchemaFactory = async () => ArchiveLDOSchema;

/* -------------------- Match Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveMatch extends Match {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveMatchSchema = SchemaFactory.createForClass(ArchiveMatch);
export const ArchiveMatchSchemaFactory = async () => ArchiveMatchSchema;

/* -------------------- Net Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveNet extends Net {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveNetSchema = SchemaFactory.createForClass(ArchiveNet);
export const ArchiveNetSchemaFactory = async () => ArchiveNetSchema;

/* -------------------- Player Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchivePlayer extends Player {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchivePlayerSchema = SchemaFactory.createForClass(ArchivePlayer);
export const ArchivePlayerSchemaFactory = async () => ArchivePlayerSchema;

/* -------------------- PlayerRanking Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchivePlayerRanking extends PlayerRanking {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchivePlayerRankingSchema = SchemaFactory.createForClass(ArchivePlayerRanking);
export const ArchivePlayerRankingSchemaFactory = async () => ArchivePlayerRankingSchema;

/* -------------------- PlayerRankingItem Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchivePlayerRankingItem extends PlayerRankingItem {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchivePlayerRankingItemSchema = SchemaFactory.createForClass(ArchivePlayerRankingItem);
export const ArchivePlayerRankingItemSchemaFactory = async () => ArchivePlayerRankingItemSchema;


/* -------------------- ArchiveProStats Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveProStats extends ProStats {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveProStatsSchema = SchemaFactory.createForClass(ArchiveProStats);
export const ArchiveProStatsSchemaFactory = async () => ArchiveProStatsSchema;

/* -------------------- PlayerStats Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchivePlayerStats extends PlayerStats {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchivePlayerStatsSchema = SchemaFactory.createForClass(ArchivePlayerStats);
export const ArchivePlayerStatsSchemaFactory = async () => ArchivePlayerStatsSchema;

/* -------------------- Room Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveRoom extends Room {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveRoomSchema = SchemaFactory.createForClass(ArchiveRoom);
export const ArchiveRoomSchemaFactory = async () => ArchiveRoomSchema;

/* -------------------- Round Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveRound extends Round {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveRoundSchema = SchemaFactory.createForClass(ArchiveRound);
export const ArchiveRoundSchemaFactory = async () => ArchiveRoundSchema;

/* -------------------- ServerReceiverOnNet Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveServerReceiverOnNet extends ServerReceiverOnNet {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveServerReceiverOnNetSchema = SchemaFactory.createForClass(ArchiveServerReceiverOnNet);
export const ArchiveServerReceiverOnNetSchemaFactory = async () => ArchiveServerReceiverOnNetSchema;

/* -------------------- ServerReceiverSinglePlay Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveServerReceiverSinglePlay extends ServerReceiverSinglePlay {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveServerReceiverSinglePlaySchema = SchemaFactory.createForClass(ArchiveServerReceiverSinglePlay);
export const ArchiveServerReceiverSinglePlaySchemaFactory = async () => ArchiveServerReceiverSinglePlaySchema;

/* -------------------- Sponsor Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveSponsor extends Sponsor {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveSponsorSchema = SchemaFactory.createForClass(ArchiveSponsor);
export const ArchiveSponsorSchemaFactory = async () => ArchiveSponsorSchema;

/* -------------------- Team Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveTeam extends Team {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveTeamSchema = SchemaFactory.createForClass(ArchiveTeam);
export const ArchiveTeamSchemaFactory = async () => ArchiveTeamSchema;

/* -------------------- Template Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveTemplate extends Template {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveTemplateSchema = SchemaFactory.createForClass(ArchiveTemplate);
export const ArchiveTemplateSchemaFactory = async () => ArchiveTemplateSchema;

/* -------------------- User Archive -------------------- */
@ObjectType()
@Schema({ timestamps: true })
export class ArchiveUser extends User {
  @Field(() => Date)
  @Prop({ default: () => new Date() })
  archivedAt: Date;


  @Field(() => String)
  @Prop({ required: true })
  originalId: string; // Store original document _id
}
export const ArchiveUserSchema = SchemaFactory.createForClass(ArchiveUser);
export const ArchiveUserSchemaFactory = async () => ArchiveUserSchema;