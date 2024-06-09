import { Args, Field, Mutation, ObjectType, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PlayerRanking, PlayerRankingItem } from './player-ranking.schema';
import { Team } from 'src/team/team.schema';
import { PlayerRankingService } from './player-ranking.service';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserRole } from 'src/user/user.schema';
import { AppResponse } from 'src/shared/response';
import { UpdatePlayerRankingInput } from './player-ranking.input';
import { TeamService } from 'src/team/team.service';
import { MatchService } from 'src/match/match.service';
import { Player } from 'src/player/player.schema';
import { PlayerService } from 'src/player/player.service';

@ObjectType()
class PlayerRankingResponse extends AppResponse<PlayerRanking[]> {
  @Field((_type) => [PlayerRanking], { nullable: true })
  data?: PlayerRanking;
}

@Resolver((_of) => PlayerRanking)
export class PlayerRankingResolver {
  constructor(
    private playerRankingService: PlayerRankingService,
    private teamService: TeamService,
    private matchService: MatchService,
    private playerService: PlayerService,
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((_returns) => PlayerRankingResponse)
  async updatePlayerRanking(
    @Args('teamId', { type: () => [String] }) teamId: string,
    @Args('input', { type: () => [UpdatePlayerRankingInput] }) input: UpdatePlayerRankingInput[],
  ) {
    try {
      const teamExist = await this.teamService.findById(teamId);
      if (!teamExist) return AppResponse.notFound('Team');

      const playerRankings = await this.playerRankingService.find({ team: teamId, rankLock: false });
      if (playerRankings.length === 0) return AppResponse.notFound('Player Ranking');

      const updatePromises = [];

      for (let i = 0; i < playerRankings.length; i += 1) {
        // updatePromises.push(this.playerRankingService.updateOneItem({ playerRanking: playerRankings[i]._id }, input));
        for (let j = 0; j < input.length; j += 1) {
          updatePromises.push(
            this.playerRankingService.updateOneItem(
              { playerRanking: playerRankings[i]._id, player: input[j].player },
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
              if (matchExist && matchExist.teamA.toString() === team._id) {
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
              } else if (matchExist.teamB.toString() === team._id) {
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
            this.teamService.updateOne({ _id: team._id }, { $addToSet: { playerRankings: { $each: teamPlayerRankingIds } } }),
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
