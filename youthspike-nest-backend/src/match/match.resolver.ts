/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { Roles } from 'src/shared/auth/roles.decorator';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { UserRole } from 'src/user/user.schema';
import { Round } from 'src/round/round.schema';
import { Net } from 'src/net/net.schema';


import { MatchMutations } from './match.mutations';
import { MatchQueries } from './match.queries';
import { Match } from './match.schema';
import { MatchResolveFields } from './match.resolve.fields';
import { GetAccessCodeResponse, GetEventWithMatchesResponse, GetMatchesResponse, GetMatchResponse } from './match.response';
import { AccessCodeInput, CreateMatchInput, FilterQueryInput, UpdateMatchInput } from './match.input';

@Resolver(() => Match)
export class MatchResolver {
  constructor(
    private readonly mutations: MatchMutations,
    private readonly queries: MatchQueries,
    private readonly fields: MatchResolveFields,
  ) {}

  // ==================== Mutations ====================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation(() => GetMatchResponse)
  async createMatch(@Args('input') input: CreateMatchInput): Promise<GetMatchResponse> {
    return this.mutations.createMatch(input);
  }


  

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation(() => GetMatchResponse)
  async deleteMatch(@Args('matchId') matchId: string) {
    return this.mutations.deleteMatch(matchId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation(() => GetMatchResponse)
  async deleteMatches(@Args('matchIds', { type: () => [String] }) matchIds: string[]) {
    return this.mutations.deleteMatches(matchIds);
  }

  @Mutation(() => GetAccessCodeResponse)
  async accessCodeValidation(@Args('input') input: AccessCodeInput) {
    return this.mutations.accessCodeValidation(input);
  }

  // ==================== Queries ====================
  @Query(() => GetMatchesResponse)
  async getMatches(@Args('filter', { nullable: true }) filter?: FilterQueryInput) {
    return this.queries.getMatches(filter);
  }

  @Query(() => GetEventWithMatchesResponse)
  async getEventWithMatches(@Args('eventId', { nullable: false }) eventId: string) {
    return this.queries.getEventWithMatches(eventId);
  }

  @Query(() => GetMatchResponse)
  async getMatch(@Args('matchId') matchId: string) {
    return this.queries.getMatch(matchId);
  }

  // ==================== Resolve Fields ====================
  @ResolveField(() => Match, { nullable: true, name: 'teamA' })
  async teamAField(@Parent() match: Match) {
    return this.fields.teamA(match);
  }

  @ResolveField(() => Match, { nullable: true, name: 'teamB' })
  async teamBField(@Parent() match: Match) {
    return this.fields.teamB(match);
  }

  @ResolveField(() => [Round])
  async rounds(@Parent() match: Match) {
    return this.fields.rounds(match);
  }

  @ResolveField(() => [Net])
  async nets(@Parent() match: Match) {
    return this.fields.nets(match);
  }

  @ResolveField(() => Match, { nullable: true, name: 'event' })
  async eventField(@Parent() match: Match) {
    return this.fields.event(match);
  }

  @ResolveField(() => Match, { nullable: true, name: 'group' })
  async groupField(@Parent() match: Match) {
    return this.fields.group(match);
  }

  @ResolveField(() => Match, { nullable: true, name: 'room' })
  async roomField(@Parent() match: Match) {
    return this.fields.room(match);
  }

  @ResolveField(() => Match, { nullable: true, name: 'teamARanking' })
  async teamARankingField(@Parent() match: Match) {
    return this.fields.teamARanking(match);
  }

  @ResolveField(() => Match, { nullable: true, name: 'teamBRanking' })
  async teamBRankingField(@Parent() match: Match) {
    return this.fields.teamBRanking(match);
  }

  @ResolveField(() => [Object])
  async serverReceiverOnNet(@Parent() match: Match) {
    return this.fields.serverReceiverOnNet(match);
  }

  @ResolveField(() => [Object])
  async serverReceiverSinglePlay(@Parent() match: Match) {
    return this.fields.serverReceiverSinglePlay(match);
  }
}