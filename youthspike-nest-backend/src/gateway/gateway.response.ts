import { Field, Int, ObjectType } from '@nestjs/graphql';
import { EActionProcess } from 'src/round/round.schema';
import { UserRole } from 'src/user/user.schema';
import { NetPointsAssign } from './gateway.input';

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

// Score keeper
/*
        // raw values
        mutate: 0, // Every time stats of a player change, this value will be increased

        // Changable values
        server,
        servingPartner,
        receiver,
        receivingPartner,

        // Relationship
        room: prevRoom._id,
        match: serverReceiverInput.match,
        net: serverReceiverInput.net,
        round: serverReceiverInput.round,
*/
@ObjectType()
export class ServerReceiverOnNet {
  @Field(() => Int, { nullable: false, defaultValue: 0 })
  mutate: number;

  @Field((_type) => String, { nullable: false })
  server: string;

  @Field((_type) => String, { nullable: false })
  servingPartner: string;

  @Field((_type) => String, { nullable: false })
  receiver: string;

  @Field((_type) => String, { nullable: false })
  receivingPartner: string;

  @Field((_type) => String, { nullable: false })
  room: string;
  @Field((_type) => String, { nullable: false })
  match: string;
  @Field((_type) => String, { nullable: false })
  net: string;
  @Field((_type) => String, { nullable: false })
  round: string;
}
