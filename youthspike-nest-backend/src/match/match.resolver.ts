/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Round } from 'src/round/round.schema';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserRole } from 'src/user/user.schema';
import { Match } from './match.schema';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { PlayerRanking } from 'src/player-ranking/player-ranking.schema';
import {
  ServerReceiverOnNet,
  ServerReceiverSinglePlay,
} from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { MatchFields } from './resolvers/match.fields';
import { MatchQueries } from './resolvers/match.queries';
import { GetAccessCodeResponse, GetEventWithMatchesResponse, GetMatchesResponse, GetMatchResponse } from './resolvers/match.response';
import { AccessCodeInput, CreateMatchInput, FilterQueryInput, SearchFilterInput, UpdateMatchInput } from './resolvers/match.input';
import { MatchMutations } from './resolvers/match.mutations';

@Resolver((_of) => Match)
export class MatchResolver {
  constructor(
    private readonly matchFields: MatchFields,
    private readonly matchQueries: MatchQueries,
    private readonly matchMutations: MatchMutations,
  ) { }

  async deleteSingle(matchExist: Match) {
    return this.matchMutations.deleteSingle(matchExist);
  }



  // ===== Mutations Functions =====
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => GetMatchResponse)
  async createMatch(@Args('input') input: CreateMatchInput): Promise<GetMatchResponse> {
    return this.matchMutations.createMatch(input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((_returns) => GetMatchResponse)
  async updateMatch(@Args('input') input: UpdateMatchInput, @Args('matchId') matchId: string) {
    return this.matchMutations.updateMatch(input, matchId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => GetMatchResponse)
  async deleteMatch(@Args('matchId') matchId: string) {
    return this.matchMutations.deleteMatch(matchId);
  }

  @Mutation((_returns) => GetAccessCodeResponse)
  async accessCodeValidation(@Args('input') input: AccessCodeInput) {
    return this.matchMutations.accessCodeValidation(input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => GetMatchResponse)
  async deleteMatches(@Args('matchIds', { type: () => [String] }) matchIds: string[]) {
    return this.matchMutations.deleteMatches(matchIds);
  }

  /**
   * QUERIES
   * ===============================================================================================
   */
  @Query((_returns) => GetMatchesResponse)
  async getMatches(@Args('filter', { nullable: true }) filter?: FilterQueryInput) {
    return this.matchQueries.getMatches(filter)
  }

  @Query((_returns) => GetEventWithMatchesResponse)
  async searchMatches(@Context() context: any, @Args('filter', { nullable: true }) filter: SearchFilterInput, @Args('eventId', { nullable: true }) eventId?: string) {
    return this.matchQueries.searchMatches(context, filter, eventId)
  }

  @Query((_returns) => GetEventWithMatchesResponse)
  async getEventWithMatches(@Context() context: any, @Args('eventId', { nullable: false }) eventId: string) {
    return this.matchQueries.getEventWithMatches(context, eventId);
  }

  @Query((_returns) => GetMatchResponse)
  async getMatch(@Args('matchId') matchId: string) {
    return this.matchQueries.getMatch(matchId);
  }

  /**
   * POPULATE
   * ===============================================================================================
   */
  @ResolveField()
  async teamA(@Parent() match: Match) {
    return this.matchFields.teamA(match);
  }

  @ResolveField()
  async teamB(@Parent() match: Match) {
    return this.matchFields.teamB(match);
  }

  @ResolveField((returns) => [Round])
  async rounds(@Parent() match: Match) {
    return this.matchFields.rounds(match);
  }

  @ResolveField((returns) => [Round])
  async nets(@Parent() match: Match) {
    return this.matchFields.nets(match);
  }

  @ResolveField(() => [ServerReceiverOnNet])
  async serverReceiverOnNet(@Parent() match: Match): Promise<ServerReceiverOnNet[]> {
    return this.matchFields.serverReceiverOnNet(match);
  }

  @ResolveField(() => [ServerReceiverSinglePlay])
  async serverReceiverSinglePlay(@Parent() match: Match): Promise<ServerReceiverSinglePlay[]> {
    return this.matchFields.serverReceiverSinglePlay(match);
  }

  @ResolveField()
  async event(@Parent() match: Match) {
    return this.matchFields.event(match);
  }

  @ResolveField()
  async group(@Parent() match: Match) {
    return this.matchFields.group(match);
  }

  @ResolveField()
  async room(@Parent() match: Match) {
    return this.matchFields.room(match);
  }

  @ResolveField(() => PlayerRanking)
  async teamARanking(@Parent() match: Match): Promise<PlayerRanking> {
    return this.matchFields.teamARanking(match);
  }

  @ResolveField(() => PlayerRanking)
  async teamBRanking(@Parent() match: Match): Promise<PlayerRanking> {
    return this.matchFields.teamBRanking(match);
  }
}