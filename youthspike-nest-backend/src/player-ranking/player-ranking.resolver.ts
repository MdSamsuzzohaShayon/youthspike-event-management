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

      // Get logged in user
      const loggedUser = await this.userService.findById(userPayload._id);

      const teamExist = await this.teamService.findById(teamId);
      if (!teamExist) return AppResponse.notFound('Team');

      const eventExist = await this.eventService.findById(teamExist.event.toString());
      if (!eventExist) return AppResponse.notFound('Event');

      if (!loggedUser) {
        return AppResponse.unauthorized();
      }

      if (loggedUser.role === UserRole.captain || loggedUser.role === UserRole.co_captain) {
        // Check date
        const isIsoTime = isISODateString(eventExist.rosterLock);
        if (isIsoTime) {
          const lastDate = new Date(eventExist.rosterLock);
          const currentDateTime = new Date();
          if (currentDateTime > lastDate) {
            // if date has passed, check for passcode
            const adminOrDirectorPasscode = userPayload.passcode || null; // Find passcode from token
            if (!adminOrDirectorPasscode) {
              return AppResponse.handleError({
                statusCode: HttpStatus.NOT_ACCEPTABLE,
                message: 'Match date passed and you do not have passcode to re-rank',
              });
            }
          }
        }
      }

      // Update player ranking in the database
      let playerRankings = await this.playerRankingService.find({
        team: teamId,
      }); // Find all player rankings
      playerRankings = playerRankings.map((pr) => pr.toObject());

      const teamRanking = playerRankings.find((pr) => pr.team && !pr?.match);
      if (!teamRanking) return AppResponse.notFound('Team Player Ranking');

      if (playerRankings.length === 0) return AppResponse.notFound('Player Ranking');

      // Get all players from the first ranking
      const teamPlayers = await this.playerService.find({ teams: teamId });
      const playerIds = new Set(teamPlayers.map((p) => String(p._id)));


      // Check if there are not rankings in PlayerRanking create all of them
      if (teamRanking.rankings.length === 0 && playerIds.size > 0) {
        // Check players who are inactive, create ranking for them
        const players = await this.playerService.find({ teams: teamId, status: EPlayerStatus.ACTIVE });
        if (players.length > 0) {
          // Create team rankings again
          const newRankings = [];
          let i = 0;
          for (const p of players) {
            const newRanking = await this.playerRankingService.createAnItem({
              player: p._id,
              rank: i + 1,
              playerRanking: teamRanking._id,
            });
            newRankings.push(newRanking._id);
            i++;
          }
          await this.playerRankingService.updateOne({ _id: teamRanking._id }, { $set: { rankings: newRankings } });
        }
      }


      // Find from database if player not exist in rankings
      const abesentPlayers: string[] = [];

      for (const ipr of input) {
        if (!playerIds.has(ipr.player)) {
          abesentPlayers.push(ipr.player);
        }
      }

      if (abesentPlayers.length > 0) {
        // Add those players to rankings if not exists
        const insertedPlayersRank = [];
        for (const pr of playerRankings) {
          let currTotalPlayers = playerIds.size;
          for (const ap of abesentPlayers) {
            const teamPlayers = teamExist.players.map((p) => p.toString());
            if (teamPlayers.includes(ap)) {
              console.log({ msg: 'This player is in the team: ', ap });
              insertedPlayersRank.push(
                this.playerRankingService.createAnItem({
                  player: ap,
                  rank: (currTotalPlayers += 1),
                  playerRanking: pr._id,
                }),
              );
              currTotalPlayers += 1;
            }
          }
        }
        if (insertedPlayersRank.length > 0) {
          console.log({ msg: 'Absent players, ', playerId: abesentPlayers });
          await Promise.all(insertedPlayersRank);
          playerRankings = await this.playerRankingService.find({
            team: teamId,
          });
          playerRankings = playerRankings.map((pr) => pr.toObject());
        }
      }

      // Updating the rank according to input
      const updatePlayerRankings: PlayerRanking[] = [];

      for (const pr of playerRankings) {
        if (pr.rankLock) continue;
        if (
          loggedUser.role !== UserRole.director &&
          loggedUser.role !== UserRole.admin &&
          loggedUser.role !== UserRole.captain &&
          loggedUser.role !== UserRole.co_captain
        )
          continue;

        updatePlayerRankings.push(pr);
      }
      // console.log({ input, playerRankings, updatePlayerRankings });

      const updatePromises = [];

      for (let i = 0; i < updatePlayerRankings.length; i += 1) {
        const validPlayerIds = new Set<string>();
        const invalidPlayerRankings = new Set<string>();
        const deleteRankingItems = [];
        if (updatePlayerRankings[i].team) {
          // Find all rankings
          const rankings = await this.playerRankingService.findItems({ playerRanking: updatePlayerRankings[i]._id });
          for (const ranking of rankings) {
            // Check player exists or not. If not exist delete them
            if (!playerIds.has(String(ranking.player))) {
              deleteRankingItems.push(
                this.playerRankingService.deleteOneItem({
                  playerRanking: updatePlayerRankings[i]._id,
                  player: ranking.player,
                }),
              );
              invalidPlayerRankings.add(String(ranking._id));
            } else {
              validPlayerIds.add(String(ranking.player));
            }
          }
        }

        await Promise.all(deleteRankingItems);
        // Remove invalid rankings from player rankings
        await this.playerRankingService.updateOne(
          { _id: updatePlayerRankings[i]._id },
          { $pull: { rankings: { $in: invalidPlayerRankings } } },
        );

        // Check that all players in playerIds, if not delete ranking for them
        for (let j = 0; j < input.length; j += 1) {
          updatePromises.push(
            this.playerRankingService.updateOneItem(
              { playerRanking: updatePlayerRankings[i]._id, player: input[j].player },
              { rank: input[j].rank },
            ),
          );
        }
      }

      await Promise.all(updatePromises);
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
