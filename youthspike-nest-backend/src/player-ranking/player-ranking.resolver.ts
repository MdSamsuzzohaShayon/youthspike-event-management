import { Args, Context, Field, Mutation, ObjectType, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PlayerRanking, PlayerRankingItem } from './player-ranking.schema';
import { PlayerRankingService } from './player-ranking.service';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserRole } from 'src/user/user.schema';
import { AppResponse } from 'src/shared/response';
import { UpdateMatchPlayerRankingInput, UpdatePlayerRankingInput } from './player-ranking.input';
import { TeamService } from 'src/team/team.service';
import { MatchService } from 'src/match/match.service';
import { ConfigService } from '@nestjs/config';
import { isISODateString, tokenToUser } from 'src/util/helper';
import { UserService } from 'src/user/user.service';
import { EventService } from 'src/event/event.service';
import { NetService } from 'src/net/net.service';
import { FilterQuery } from 'mongoose';
import { PlayerService } from 'src/player/player.service';
import { EPlayerStatus, Player } from 'src/player/player.schema';
import rebuildSinglePlayerRanking from 'src/util/rebuildSinglePlayerRanking';

@ObjectType()
class PlayerRankingResponse extends AppResponse<PlayerRanking[]> {
  @Field((_type) => [PlayerRanking], { nullable: true })
  data?: PlayerRanking[];
}

@ObjectType()
class PlayerMatchRankingResponse extends AppResponse<PlayerRanking[]> {
  @Field((_type) => [PlayerRanking], { nullable: true })
  data?: PlayerRanking[];
}

@Resolver((_of) => PlayerRanking)
export class PlayerRankingResolver {
  constructor(
    private configService: ConfigService,
    private playerRankingService: PlayerRankingService,
    private teamService: TeamService,
    private matchService: MatchService,
    private userService: UserService,
    private eventService: EventService,
    private playerService: PlayerService,
  ) {}

  private async recreatePlayerRankings(
    playerRankings: PlayerRanking[],
    rankingInput: UpdatePlayerRankingInput[],
    teamId: string,
  ): Promise<void> {
    const sortedRankingInput = rankingInput.sort((a, b) => a.rank - b.rank);

    // Fetch active team players only once
    const teamPlayers = await this.playerService.find({
      teams: teamId,
      status: EPlayerStatus.ACTIVE,
    });

    const playerIds = new Set(teamPlayers.map((p) => String(p._id)));

    // 1️⃣ Delete all ranking items concurrently
    await Promise.all(playerRankings.map((pr) => this.playerRankingService.deleteManyItem({ playerRanking: pr._id })));

    // 2️⃣ Recreate rankings concurrently using helper function
    await Promise.all(
      playerRankings.map((playerRanking) =>
        this.rebuildSinglePlayerRanking(playerRanking, sortedRankingInput, playerIds),
      ),
    );
  }

  /**
   * Helper: rebuild a single player ranking with all items
   */
  private async rebuildSinglePlayerRanking(
    playerRanking: PlayerRanking,
    sortedRankingInput: UpdatePlayerRankingInput[],
    playerIds: Set<string>,
  ): Promise<void> {
    await rebuildSinglePlayerRanking(playerRanking, sortedRankingInput, playerIds, this.playerRankingService);
  }

  private async checkRosterLock(eventExist: any, loggedUser: any, userPayload: any) {
    if (loggedUser.role === UserRole.captain || loggedUser.role === UserRole.co_captain) {
      const isIsoTime = isISODateString(eventExist.rosterLock);
      if (!isIsoTime) return;

      const lastDate = new Date(eventExist.rosterLock);
      const currentDateTime = new Date();

      if (currentDateTime > lastDate && !userPayload.passcode) {
        throw AppResponse.handleError({
          statusCode: HttpStatus.NOT_ACCEPTABLE,
          message: 'Match date passed and you do not have passcode to re-rank',
        });
      }
    }
  }


  private async updateRankingForATeam(matchId: string, teamId: string, rankLock: boolean){
    const teamRanking = await this.playerRankingService.findOne({
      team: teamId,
      $or: [{ match: { $exists: false } }, { match: null }],
      rankLock: false,
    });
    if (!teamRanking) return AppResponse.notFound('Team Ranking');
    const matchRanking = await this.playerRankingService.findOne({ team: teamId, match: matchId });
    if (!matchRanking) return AppResponse.notFound('Match Ranking');

    const teamPlayers = await this.playerService.find({ teams: teamId, status: EPlayerStatus.ACTIVE });
    const playerIds = new Set([...teamPlayers.map((p) => String(p._id))]);
    let rankings = await this.playerRankingService.findItems({ playerRanking: teamRanking._id });

    // No duplicate items
    rankings = rankings.filter((r)=> playerIds.has(String(r.player)));

    const sortedTeamRankings: UpdatePlayerRankingInput[] = [...rankings]
      .map((r) => ({ player: String(r.player), rank: r.rank }))
      .sort((a, b) => a.rank - b.rank);

    await this.playerRankingService.deleteManyItem({ playerRanking: matchRanking._id });

    await this.rebuildSinglePlayerRanking(matchRanking, sortedTeamRankings, playerIds);

    await this.playerRankingService.updateOne(
      { team: teamId, match: matchId },
      { $set: { rankLock: rankLock } },
    );
  }

  /**
   * =============================
   * Mutations
   */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((_returns) => PlayerRankingResponse)
  async updatePlayerRanking(
    @Context() context: any,
    @Args('teamId', { type: () => [String] }) teamId: string,
    @Args('input', { type: () => [UpdatePlayerRankingInput] }) input: UpdatePlayerRankingInput[],
  ) {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const userPayload = tokenToUser(context, secret);
      const loggedUser = await this.userService.findById(userPayload._id);

      const allowedRoles = new Set([UserRole.director, UserRole.admin, UserRole.captain, UserRole.co_captain]);

      if (!allowedRoles.has(loggedUser.role)) {
        return AppResponse.handleError({ message: 'You do not have permission to change ranking!', code: 406 });
      }

      // Validate team, event, and user
      const teamExist = await this.teamService.findById(teamId);
      if (!teamExist) return AppResponse.notFound('Team');

      if (!loggedUser) return AppResponse.unauthorized();

      const eventExist = await this.eventService.findById(String(teamExist.event));
      if (!eventExist) return AppResponse.notFound('Event');

      await this.checkRosterLock(eventExist, loggedUser, userPayload);

      // Get player rankings
      let playerRankings = await this.playerRankingService.find({ team: teamId, rankLock: false });
      playerRankings = playerRankings.map((pr) => pr.toObject());
      if (playerRankings.length === 0) return AppResponse.notFound('Player Ranking');

      // Ensure team ranking exists
      const teamRanking = playerRankings.find((pr) => pr.team && !pr.match);
      if (!teamRanking) return AppResponse.notFound('Team Player Ranking');

      // Get active team players
      const teamPlayers = await this.playerService.find({ teams: teamId, status: EPlayerStatus.ACTIVE });
      const playerIds = new Set(teamPlayers.map((p) => String(p._id)));

      await this.recreatePlayerRankings(playerRankings, input, teamId);

      return {
        code: HttpStatus.ACCEPTED,
        message: 'Multiple Players ranking have been created successfully!',
        success: true,
        data: null,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((_returns) => PlayerMatchRankingResponse)
  async updateMatchPlayerRanking(
    @Args('input', { type: () => UpdateMatchPlayerRankingInput }) input: UpdateMatchPlayerRankingInput,
  ) {
    try {
      // Only proceed if rankLock is explicitly true or false
      if (input?.rankLock === true || input?.rankLock === false) {
        const matchExist = await this.matchService.findOne({_id: input.match});
        await Promise.all([
          this.updateRankingForATeam(input.match, String(matchExist.teamA), input.rankLock),
          this.updateRankingForATeam(input.match, String(matchExist.teamB), input.rankLock),
        ])
      }

      return {
        code: HttpStatus.ACCEPTED,
        message: 'Team player ranking has been updated successfully!',
        success: true,
        data: {
          _id: null, 
          rankLock: !!input?.rankLock 
        },
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => PlayerRankingResponse)
  async resetAllPlayerRankings() {
    try {
      const teams = await this.teamService.find({});
      const promiseOperations = [];
      for (const team of teams) {
        //
        if (!team?.playerRankings || team?.playerRankings.length === 0) {
          // Create player ranking when creating match
          const playerRankings = [];
          for (let i = 0; i < team.players.length; i += 1) {
            // Create player ranking when creating team
            playerRankings.push({ rank: i + 1, player: team.players[i] });
          }
          const teamPlayerRanking = await this.playerRankingService.create({
            rankings: playerRankings,
            rankLock: false,
            team: team._id,
          });

          const teamPlayerRankingIds = [teamPlayerRanking._id];

          // Update player ranking for match
          if (team.matches.length > 0) {
            for (const match of team.matches) {
              const matchExist = await this.matchService.findById(match.toString());
              if (matchExist && matchExist?.teamA?.toString() === team._id) {
                const teamAItems = await this.playerRankingService.findItems({ playerRanking: teamPlayerRanking._id });

                const teamARankings = [];

                for (let i = 0; i < teamAItems.length; i += 1) {
                  teamARankings.push({ player: teamAItems[i].player, rank: teamAItems[i].rank });
                }

                const newTeamARanking = await this.playerRankingService.create({
                  rankings: teamARankings,
                  rankLock: false,
                  team: team._id,
                  match,
                });
                teamPlayerRankingIds.push(newTeamARanking._id);

                await Promise.all([
                  this.teamService.updateOne({ _id: team._id }, { $addToSet: { playerRankings: newTeamARanking._id } }),
                  // Match update
                  this.matchService.updateOne({ _id: match }, { teamARanking: newTeamARanking._id }),
                ]);
              } else if (matchExist?.teamB?.toString() === team._id) {
                const teamBItems = await this.playerRankingService.findItems({ playerRanking: teamPlayerRanking._id });

                const teamBRankings = [];

                for (let i = 0; i < teamBItems.length; i += 1) {
                  teamBRankings.push({ player: teamBItems[i].player, rank: teamBItems[i].rank });
                }

                const newTeamBRanking = await this.playerRankingService.create({
                  rankings: teamBRankings,
                  rankLock: false,
                  team: team._id,
                  match,
                });
                teamPlayerRankingIds.push(newTeamBRanking._id);

                await Promise.all([
                  this.teamService.updateOne({ _id: team._id }, { $addToSet: { playerRankings: newTeamBRanking._id } }),
                  // Match update
                  this.matchService.updateOne({ _id: match }, { teamBRanking: newTeamBRanking._id }),
                ]);
              }
            }
          }

          promiseOperations.push(
            this.teamService.updateOne(
              { _id: team._id },
              { $addToSet: { playerRankings: { $each: teamPlayerRankingIds } } },
            ),
          );
        }
      }

      await Promise.all(promiseOperations);
      return {
        code: HttpStatus.ACCEPTED,
        message: 'Resetted all items',
        success: true,
        data: null,
      };
    } catch (error) {
      console.log(error);
      return AppResponse.handleError(error);
    }
  }

  @ResolveField(() => [PlayerRankingItem]) // Specify the return type as an array of PlayerRankingItem
  async rankings(@Parent() pr: PlayerRanking): Promise<PlayerRankingItem[]> {
    try {
      //   const pr = await this.playerRankingService.findById(team.playerRanking.toString());
      const rankingItems = await this.playerRankingService.findItems({ _id: { $in: pr.rankings } });
      return rankingItems;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
