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
    private playerService: PlayerService
  ) {}

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


