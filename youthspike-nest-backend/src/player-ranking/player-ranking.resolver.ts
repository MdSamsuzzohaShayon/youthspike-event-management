import { Args, Context, Field, Mutation, ObjectType, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PlayerRanking, PlayerRankingItem } from './player-ranking.schema';
import { PlayerRankingService } from './player-ranking.service';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserRole } from 'src/user/user.schema';
import { AppResponse } from 'src/shared/response';
import { UpdatePlayerRankingInput, UpdateTeamPlayerRankingInput } from './player-ranking.input';
import { TeamService } from 'src/team/team.service';
import { MatchService } from 'src/match/match.service';
import { ConfigService } from '@nestjs/config';
import { isISODateString, tokenToUser } from 'src/util/helper';
import { UserService } from 'src/user/user.service';
import { EventService } from 'src/event/event.service';
import { NetService } from 'src/net/net.service';
import { FilterQuery } from 'mongoose';
import { PlayerService } from 'src/player/player.service';
import { EPlayerStatus } from 'src/player/player.schema';

@ObjectType()
class PlayerRankingResponse extends AppResponse<PlayerRanking[]> {
  @Field((_type) => [PlayerRanking], { nullable: true })
  data?: PlayerRanking[];
}

@ObjectType()
class PlayerTeamRankingResponse extends AppResponse<PlayerRanking[]> {
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
    private netService: NetService,
  ) {}



  
  private async validateTeamAndUser(teamId: string, loggedUser: any, userPayload: any) {
    const teamExist = await this.teamService.findById(teamId);
    if (!teamExist) return AppResponse.notFound('Team');
  
    if (!loggedUser) return AppResponse.unauthorized();
  
    return teamExist;
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
  
  private async getPlayerRankings(teamId: string): Promise<PlayerRanking[]> {
    const rankings = await this.playerRankingService.find({ team: teamId });
    return rankings.map((pr) => pr.toObject());
  }
  
  private async ensureRankingsExistForPlayers(teamRanking: any, teamPlayers: any[]) {
    if (teamRanking.rankings.length === 0 && teamPlayers.length > 0) {
      const newRankings = await Promise.all(
        teamPlayers.map((p, i) =>
          this.playerRankingService.createAnItem({
            player: p._id,
            rank: i + 1,
            playerRanking: teamRanking._id,
          }),
        ),
      );
      await this.playerRankingService.updateOne(
        { _id: teamRanking._id },
        { $set: { rankings: newRankings.map((r) => r._id) } },
      );
    }
  }
  
  private async addAbsentPlayersToRankings(
    teamExist: any,
    playerRankings: PlayerRanking[],
    teamId: string,
    playerIds: Set<string>,
    input: UpdatePlayerRankingInput[],
  ): Promise<PlayerRanking[]> {
    const absentPlayers = input
      .filter((ipr) => !playerIds.has(ipr.player))
      .map((ipr) => ipr.player);
  
    if (absentPlayers.length === 0) return playerRankings;
  
    const teamPlayerIds = teamExist.players.map((p) => p.toString());
    const validAbsentPlayers = absentPlayers.filter((id) => teamPlayerIds.includes(id));
  
    if (validAbsentPlayers.length === 0) return playerRankings;
  
    const insertPromises: Promise<any>[] = [];
  
    for (const pr of playerRankings) {
      let currentCount = playerIds.size;
      for (const playerId of validAbsentPlayers) {
        insertPromises.push(
          this.playerRankingService.createAnItem({
            player: playerId,
            rank: ++currentCount,
            playerRanking: pr._id,
          }),
        );
      }
    }
  
    if (insertPromises.length > 0) await Promise.all(insertPromises);
    return this.getPlayerRankings(teamId);
  }
  
  private filterUpdatableRankings(playerRankings: PlayerRanking[], loggedUser: any): PlayerRanking[] {
    return playerRankings.filter(
      (pr) => !pr.rankLock,
    );
  }
  
  private async updatePlayerRanks(
    updatePlayerRankings: PlayerRanking[],
    input: UpdatePlayerRankingInput[],
    playerIds: Set<string>,
  ) {
    const updatePromises: Promise<any>[] = [];
  
    for (const ranking of updatePlayerRankings) {
      const rankings = await this.playerRankingService.findItems({
        playerRanking: ranking._id,
      });
  
      const { deleteRankingItems, invalidIds } = this.cleanInvalidRankings(rankings, ranking._id, playerIds);
  
      // Execute deletions and clean up references
      if (deleteRankingItems.length > 0) await Promise.all(deleteRankingItems);
  
      await this.playerRankingService.updateOne(
        { _id: ranking._id },
        { $pull: { rankings: { $in: invalidIds } } },
      );
  
      // Apply updated ranks
      for (const { player, rank } of input) {
        updatePromises.push(
          this.playerRankingService.updateOneItem(
            { playerRanking: ranking._id, player },
            { rank },
          ),
        );
      }
    }
  
    await Promise.all(updatePromises);
  }
  
  private cleanInvalidRankings(rankings: any[], rankingId: string, validPlayers: Set<string>) {
    const validPlayerIds = new Set<string>();
    const invalidIds = new Set<string>();
    const deleteRankingItems: Promise<any>[] = [];
  
    for (const r of rankings) {
      const playerId = String(r.player);
  
      if (validPlayerIds.has(playerId) || !validPlayers.has(playerId)) {
        invalidIds.add(String(r._id));
        deleteRankingItems.push(
          this.playerRankingService.deleteOneItem({
            playerRanking: rankingId,
            player: r.player,
          }),
        );
      } else {
        validPlayerIds.add(playerId);
      }
    }
  
    return { deleteRankingItems, invalidIds };
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

      const allowedRoles = new Set([
        UserRole.director,
        UserRole.admin,
        UserRole.captain,
        UserRole.co_captain,
      ]);

      if(!allowedRoles.has(loggedUser.role)){
        return AppResponse.handleError({message: "You do not have permission to change ranking!", code: 406});
      }
  
      // Validate team, event, and user
      const teamExist = await this.validateTeamAndUser(teamId, loggedUser, userPayload);
      if (!teamExist || 'code' in teamExist) return teamExist;
      const eventExist = await this.eventService.findById(String(teamExist.event));
      if (!eventExist) return AppResponse.notFound('Event');
  
      await this.checkRosterLock(eventExist, loggedUser, userPayload);
  
      // Get player rankings
      let playerRankings = await this.getPlayerRankings(teamId);
      if (playerRankings.length === 0) return AppResponse.notFound('Player Ranking');
  
      // Ensure team ranking exists
      const teamRanking = playerRankings.find((pr) => pr.team && !pr.match);
      if (!teamRanking) return AppResponse.notFound('Team Player Ranking');
  
      // Get active team players
      const teamPlayers = await this.playerService.find({ teams: teamId, status: EPlayerStatus.ACTIVE });
      const playerIds = new Set(teamPlayers.map((p) => String(p._id)));
  
      // Ensure rankings exist for all players
      await this.ensureRankingsExistForPlayers(teamRanking, teamPlayers);
  
      // Handle absent players (not in ranking)
      playerRankings = await this.addAbsentPlayersToRankings(teamExist, playerRankings, teamId, playerIds, input);
  
      // Filter rankings for update
      const updatePlayerRankings = this.filterUpdatableRankings(playerRankings, loggedUser);
  
      // Perform updates
      await this.updatePlayerRanks(updatePlayerRankings, input, playerIds);
  
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
  @Mutation((_returns) => PlayerTeamRankingResponse)
  async updateTeamPlayerRanking(
    @Args('input', { type: () => UpdateTeamPlayerRankingInput }) input: UpdateTeamPlayerRankingInput,
  ) {
    try {
      let pr = null;

      // Only proceed if rankLock is explicitly true or false
      if (input?.rankLock === true || input?.rankLock === false) {
        const rankingFilter: FilterQuery<PlayerRanking> = {};
        if (input?.team) rankingFilter.team = input.team;
        if (input?.match) rankingFilter.match = input.match;

        // Case when rankLock is being unlocked (false) and match exists
        if (input?.match && input.rankLock === false) {
          // Fetch team ranking with rankLock false
          const teamRankingDoc = await this.playerRankingService.findOne({
            team: input.team,
            rankLock: false,
            $or: [{ match: { $exists: false } }, { match: null }],
          });

          if (!teamRankingDoc) return AppResponse.notFound('Player Ranking');

          const teamRanking = teamRankingDoc.toObject();

          // Fetch all ranking items for the team ranking
          const rankingsDocs = await this.playerRankingService.findItems({ playerRanking: teamRanking._id });
          const teamRankingMap = new Map(rankingsDocs.map((r) => [String(r.player), r.rank]));

          // Fetch match ranking and its items
          const matchRankingDoc = await this.playerRankingService.findOne({
            team: input.team,
            match: input.match,
          });

          if (!matchRankingDoc) return AppResponse.notFound('Match Ranking');

          const matchRanking = matchRankingDoc.toObject();
          const mrankingsDocs = await this.playerRankingService.findItems({ playerRanking: matchRanking._id });
          let mrankings: PlayerRankingItem[] = mrankingsDocs.map((mr) => mr.toObject());

          if (mrankings.length > rankingsDocs.length) {
            // Remove players that is not team ranking
            const teamPlayerIds = new Set(rankingsDocs.map((r) => String(r.player)));
            const newMatchRankings: PlayerRankingItem[] = [];
            const rankingsToBeDeleted: PlayerRankingItem[] = [];
            // mrankingsDocs
            for (let i = 0; i < mrankings.length; i++) {
              const mr = mrankings[i];
              // Some players need to remove from team moved, and need to delete their rankings for the match
              if (teamPlayerIds.has(String(mr.player))) {
                newMatchRankings.push(mr);
              } else {
                rankingsToBeDeleted.push(mr);
              }
            }
            mrankings = newMatchRankings;

            const deleteRankings = [];
            for (let i = 0; i < rankingsToBeDeleted.length; i++) {
              deleteRankings.push(
                this.playerRankingService.updateOne(
                  { _id: rankingsToBeDeleted[i].playerRanking },
                  { $pull: { rankings: rankingsToBeDeleted[i]._id } },
                ),
              );
              deleteRankings.push(this.playerRankingService.deleteOneItem({ _id: rankingsToBeDeleted[i]._id }));
            }
            if (deleteRankings.length > 0) {
              await Promise.all(deleteRankings);
            }
          }

          // Prepare bulk update operations
          const bulkUpdates = mrankings.map((r, index) => {
            const newRank = teamRankingMap.get(String(r.player)) ?? index + 1;
            return this.playerRankingService.updateOneItem({ _id: r._id }, { $set: { rank: newRank } });
          });

          // Execute all updates concurrently
          await Promise.all(bulkUpdates);
        }

        // Update rankLock for filtered rankings
        await this.playerRankingService.updateMany(rankingFilter, { $set: { rankLock: input.rankLock } });

        // Fetch updated documents
        pr = await this.playerRankingService.find(rankingFilter);
      }

      return {
        code: HttpStatus.ACCEPTED,
        message: 'Team player ranking has been updated successfully!',
        success: true,
        data: pr,
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
