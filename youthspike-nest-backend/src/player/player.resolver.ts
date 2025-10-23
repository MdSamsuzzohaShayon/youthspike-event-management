import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CreatePlayerInput, PlayerSearchFilter, UpdatePlayerInput, UpdatePlayersInput } from './resolvers/player.input';
import { Player } from './player.schema';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { User, UserRole } from 'src/user/user.schema';
import { Event } from 'src/event/event.schema';
import { Team } from 'src/team/team.schema';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';
import {
  GetEventWithPlayersResponse,
  GetPlayerAndTeamsResponse,
  PlayerResponse,
  PlayersResponse,
  PlayersSearchResponse,
} from './resolvers/player.response';
import { PlayerMutations } from './resolvers/player.mutations';
import { PlayerQueries } from './resolvers/player.queries';
import { PlayerFields } from './resolvers/player.fields';

@Resolver((_of) => Player) // Specify the object type for the resolver
export class PlayerResolver {
  constructor(
    private playerMutations: PlayerMutations,
    private playerQueries: PlayerQueries,
    private playerFields: PlayerFields,
  ) {}

  /**
   * MUTATIONS
   * ===============================================================================================
   */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => PlayerResponse) // Specify the return type
  async createPlayer(
    @Args('input') input: CreatePlayerInput,
    @Args({ name: 'profile', type: () => GraphQLUpload, nullable: true }) profile?: Upload,
  ) {
    return this.playerMutations.createPlayer({ input, profile });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation(() => PlayerResponse)
  async updatePlayer(
    @Args('input') input: UpdatePlayerInput,
    @Args('playerId') playerId: string,
    @Args({ name: 'profile', type: () => GraphQLUpload, nullable: true }) profile?: Upload,
  ): Promise<PlayerResponse> {
    return this.playerMutations.updatePlayer({ input, playerId, profile });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((_returns) => PlayersResponse)
  async updatePlayers(
    @Args('input', { type: () => [UpdatePlayersInput] }) input: UpdatePlayersInput[],
  ): Promise<PlayersResponse> {
    return this.playerMutations.updatePlayers(input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => PlayersResponse)
  async createMultiPlayers(
    @Args('uploadedFile', { type: () => GraphQLUpload, nullable: false }) uploadedFile: Upload,
    @Args('eventId') eventId: string,
    @Args('division') division: string,
  ) {
    return this.playerMutations.createMultiPlayers({ division, eventId, uploadedFile });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => PlayersResponse)
  async deletePlayer(@Args('playerId', { nullable: false }) playerId: string) {
    return this.playerMutations.deletePlayer(playerId);
  }

  /**
   * QUERY
   * ===============================================================================================
   */

  @Query((_returns) => PlayerResponse) // Specify the return type
  async getPlayer(@Args('playerId') playerId: string): Promise<PlayerResponse> {
    return this.playerQueries.getPlayer(playerId);
  }

  @Query((_returns) => GetPlayerAndTeamsResponse) // Specify the return type
  async getPlayerAndTeams(@Args('playerId') playerId: string, @Args('eventId') eventId: string) {
    return this.playerQueries.getPlayerAndTeams(playerId, eventId);
  }

  @Query((_returns) => PlayersResponse) // Specify the return type
  async getPlayers(@Args('eventId', { nullable: true }) eventId: string): Promise<PlayersResponse> {
    return this.playerQueries.getPlayers(eventId);
  }

  @Query((_returns) => GetEventWithPlayersResponse)
  async getEventWithPlayers(@Context() context: any, @Args('eventId', { nullable: false }) eventId: string) {
    return this.playerQueries.getEventWithPlayers(context, eventId);
  }


  @Query((_returns) => PlayersSearchResponse)
  async searchPlayers(@Args('eventId', { nullable: false }) eventId: string, @Args('filter', { nullable: true }) filter: PlayerSearchFilter) {
    return this.playerQueries.searchPlayers(eventId, filter);
  }

  /**
   * POPULATE
   * ===============================================================================================
   */
  @ResolveField(() => Event) // Specify the return type
  async event(@Parent() player: Player): Promise<Event> {
    return this.playerFields.event(player);
  }
  @ResolveField(() => [Event]) // Specify the return type
  async events(@Parent() player: Player): Promise<Event[]> {
    return this.playerFields.events(player);
  }

  // Do this for team and net as well
  @ResolveField(() => Team)
  async teams(@Parent() player: Player): Promise<Team[]> {
    return this.playerFields.teams(player);
  }

  @ResolveField(() => Team, { nullable: true })
  async captainofteams(@Parent() player: Player): Promise<Team[]> {
    return this.playerFields.captainofteams(player);
  }

  @ResolveField(() => Team, { nullable: true })
  async cocaptainofteams(@Parent() player: Player): Promise<Team[]> {
    return this.playerFields.cocaptainofteams(player);
  }

  @ResolveField(() => User, { nullable: true })
  async captainuser(@Parent() player: Player): Promise<User | null> {
    return this.playerFields.captainuser(player);
  }

  @ResolveField(() => User, { nullable: true })
  async cocaptainuser(@Parent() player: Player): Promise<User | null> {
    return this.playerFields.cocaptainuser(player);
  }
}
