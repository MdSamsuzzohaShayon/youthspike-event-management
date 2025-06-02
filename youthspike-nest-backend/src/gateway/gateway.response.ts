import { Field, ObjectType } from "@nestjs/graphql";
import { EActionProcess } from "src/round/round.schema";
import { UserRole } from "src/user/user.schema";
import { NetPointsAssign } from "./gateway.input";

@ObjectType()
export class RoomRoundProcess {
  @Field({ nullable: false })
  _id: string;

  @Field({ nullable: false })
  num: number;

  @Field({ nullable: false })
  teamAProcess: null | EActionProcess;

  @Field({ nullable: false })
  teamBProcess: null | EActionProcess;
}

@ObjectType()
export class RoomLocal {
  @Field({ nullable: false })
  _id: string;

  @Field({ nullable: false })
  match: string;

  @Field({ nullable: true })
  teamA: null | string;

  @Field({ nullable: true })
  teamAClient: null | string;

  @Field({ nullable: true })
  teamB: null | string;

  @Field({ nullable: true })
  teamBClient: null | string;

  @Field(() => [RoomRoundProcess], { nullable: false, defaultValue: [] })
  rounds: RoomRoundProcess[];
}

// No Admin or co captain
@ObjectType()
export class GeneralClient {
  @Field({ nullable: false })
  _id: string;

  @Field({ nullable: false })
  userRole: UserRole;

  @Field((_type) => [String], { nullable: true })
  matches: string[]; // which specific match he has entered


  @Field({ nullable: true })
  connectedAt?: Date;

  @Field({ nullable: true })
  lastActive?: Date;
}

@ObjectType()
export class MatchRoundCommon {
  @Field((_type) => String, { nullable: false })
  _id: string;
  @Field((_type) => String, { nullable: false })
  match: string;
}

@ObjectType()
export class MatchRound extends MatchRoundCommon {
  @Field((_type) => EActionProcess, { nullable: false })
  teamAProcess: EActionProcess;
  @Field((_type) => EActionProcess, { nullable: false })
  teamBProcess: EActionProcess;
}

@ObjectType()
export class MatchRoundNet extends MatchRoundCommon {
  @Field(() => [NetPointsAssign], { nullable: false })
  nets: NetPointsAssign[];

  @Field((_type) => Boolean, { nullable: true })
  matchCompleted: boolean;
}
