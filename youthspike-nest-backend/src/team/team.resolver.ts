/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserRole } from 'src/user/user.schema';
import { Team } from './team.schema';
import { CreateTeamInput, TeamSearchFilter, UpdateTeamInput } from './resolvers/team.input';
import { Player } from 'src/player/player.schema';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';
import { PlayerRanking, PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';
import { Match } from 'src/match/match.schema';
import {
  CreateOrUpdateTeamResponse,
  GetEventWithTeamsResponse,
  GetTeamDetailsResponse,
  GetTeamResponse,
  GetTeamSearchResponse,
  GetTeamsResponse,
  GetTeamstandingsResponse,
} from './resolvers/team.response';
import { TeamFields } from './resolvers/team.fields';
import { TeamQueries } from './resolvers/team.queries';
import { TeamMutations } from './resolvers/team.mutations';

@Resolver((of) => Team)
export class TeamResolver {
  constructor(
    private readonly teamFields: TeamFields,
    private readonly teamQueris: TeamQueries,
    private readonly teamMutations: TeamMutations,
  ) {}



  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateTeamResponse)
  async createTeam(
    @Args('input') input: CreateTeamInput,
    @Args({ name: 'logo', type: () => GraphQLUpload, nullable: true })
    logo?: Upload,
  ): Promise<CreateOrUpdateTeamResponse> {
    return this.teamMutations.createTeam(input, logo);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateTeamResponse)
  async updateTeam(
    @Args('input') input: UpdateTeamInput,
    @Args('teamId') teamId: string,
    @Args('eventId') eventId: string,
    @Args({ name: 'logo', type: () => GraphQLUpload, nullable: true })
    logo?: Upload,
  ): Promise<CreateOrUpdateTeamResponse> {
    return this.teamMutations.updateTeam(input, teamId, eventId, logo);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateTeamResponse)
  async deleteTeam(@Args('teamId') teamId: string): Promise<CreateOrUpdateTeamResponse> {
    return this.teamMutations.deleteTeam(teamId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateTeamResponse)
  async deleteTeams(@Args('teamIds', { type: () => [String] }) teamIds: string[]): Promise<CreateOrUpdateTeamResponse> {
    return this.teamMutations.deleteTeams(teamIds);
  }

  
  /**
   * Queries
   */
  @Roles(UserRole.admin, UserRole.director)
  @Query((_returns) => GetTeamsResponse)
  async getTeams(@Args('eventId', { nullable: true }) eventId: string) {
    return this.teamQueris.getTeams(eventId);
  }

  @Query((_returns) => GetEventWithTeamsResponse)
  async getEventWithTeams(@Args('eventId', { nullable: true }) eventId: string) {
    return this.teamQueris.getEventWithTeams(eventId);
  }

  @Roles(UserRole.admin, UserRole.director)
  @Query((returns) => GetTeamResponse)
  async getTeam(@Args('teamId') teamId: string) {
    return this.teamQueris.getTeam(teamId);
  }

  @Query((_returns) => GetTeamDetailsResponse)
  async getTeamDetails(@Args('teamId') teamId: string) {
    return this.teamQueris.getTeamDetails(teamId);
  }

  @Query((_returns) => GetTeamSearchResponse)
  async searchTeams(@Args('eventId') eventId: string, @Args('filter', { nullable: true }) filter: TeamSearchFilter) {
    return this.teamQueris.searchTeams(eventId, filter);
  }

  @Query((_returns) => GetTeamstandingsResponse)
  async getTeamStandings(@Args('eventId') eventId: string) {
    return this.teamQueris.getTeamStandings(eventId);
  }
  /**
   * POPULATE
   * ===============================================================================================
   */

  @ResolveField(() => [Player]) // Specify the return type for "players"
  async players(@Parent() team: Team): Promise<Player[]> {
    return this.teamFields.players(team);
  }

  @ResolveField(() => [Player]) // Specify the return type for "players"
  async moved(@Parent() team: Team): Promise<Player[]> {
    return this.teamFields.moved(team);
  }

  @ResolveField(() => PlayerRanking, { nullable: true })
  async playerRanking(@Parent() team: Team): Promise<PlayerRanking> {
    return this.teamFields.playerRanking(team);
  }

  @ResolveField(() => [PlayerRankingItem]) // Specify the return type as an array of PlayerRankingItem
  async rankings(@Parent() team: Team): Promise<PlayerRankingItem[]> {
    return this.teamFields.rankings(team);
  }

  @ResolveField(() => PlayerRankingItem) // Specify the return type as an array of PlayerRankingItem
  async player(@Parent() pri: PlayerRankingItem): Promise<Player> {
    return this.teamFields.player(pri);
  }

  @ResolveField(() => Player, { nullable: true })
  async captain(@Parent() team: Team) {
    return this.teamFields.captain(team);
  }

  @ResolveField(() => Player, { nullable: true })
  async cocaptain(@Parent() team: Team) {
    return this.teamFields.cocaptain(team);
  }

  @ResolveField()
  async event(@Parent() team: Team) {
      return this.teamFields.event(team);
  }

  @ResolveField()
  async group(@Parent() team: Team) {
    return this.teamFields.group(team);
  }

  @ResolveField() // Specify the return type for "players"
  async matches(@Parent() team: Team): Promise<Match[]> {
    return this.teamFields.matches(team);
  }
}
