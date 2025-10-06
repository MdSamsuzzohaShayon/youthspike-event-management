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

      if (playerRankings.length === 0) return AppResponse.notFound('Player Ranking');

      // Get all players from the first ranking
      const firstRankings = playerRankings[0];
      const findRankingItems = await this.playerRankingService.findItems({ playerRanking: firstRankings._id });
      const playerIds = new Set();
      findRankingItems.forEach((fri) => {
        playerIds.add(fri.player.toString());
      });

      // Find from database if player not exist in rankings
      const abesentPlayers: string[] = [];

      for (const ipr of input) {
        if (!playerIds.has(ipr.player)) {
          abesentPlayers.push(ipr.player);
        }
      }

      /*
      //  If there is more or less input then player rankings
      if (input.length !== firstRankings.rankings.length) {
        console.log({
          msg: 'Ranking length did not match, ',
          inputLength: input.length,
          dbRankingLength: firstRankings.rankings.length,
        });
        console.log({ abesentPlayers, teamPlayers: teamExist.players.map((p) => p.toString()), input });
      }
      */

      if (abesentPlayers.length > 0) {
        // Add those players to rankings if not exists
        const insertedPlayersRank = [];
        for (const pr of playerRankings) {
          let currTotalPlayers = firstRankings.rankings.length;
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

        /*
        if (pr.match) {
          // Find the match, nets of that match
          const firstNet = await this.netService.findOne({ match: pr.match, num: 1 });
          if (firstNet) {
            if (!firstNet.teamAPlayerA && !firstNet.teamAPlayerB && !firstNet.teamBPlayerA && !firstNet.teamBPlayerB) {
              updatePlayerRankings.push(pr);
            }
          }
        } else {
          updatePlayerRankings.push(pr);
        }
        */

        updatePlayerRankings.push(pr);
      }
      // console.log({ input, playerRankings, updatePlayerRankings });

      const updatePromises = [];

      for (let i = 0; i < updatePlayerRankings.length; i += 1) {
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
  
          // Prepare bulk update operations
          const bulkUpdates = mrankingsDocs.map((r, index) => {
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
