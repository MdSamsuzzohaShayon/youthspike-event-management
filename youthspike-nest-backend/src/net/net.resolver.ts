/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Round } from 'src/round/round.schema';
import { Roles } from 'src/shared/auth/roles.decorator';
import { AppResponse } from 'src/shared/response';
import { NetService } from 'src/net/net.service';
import { RoundService } from 'src/round/round.service';
import { UserRole } from 'src/user/user.schema';
import { Net } from './net.schema';
import { UpdateMultipleNetInput, UpdateNetInput } from './net.input';
import { TeamService } from 'src/team/team.service';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { GetNetResponse, GetNetsResponse } from './net.response';
import { MatchService } from 'src/match/match.service';

@Resolver((of) => Net)
export class NetResolver {
  constructor(
    private roundService: RoundService,
    private netService: NetService,
    private teamService: TeamService,
    private matchService: MatchService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((__returns) => GetNetResponse)
  async updateNet(@Args('input') input: UpdateNetInput, @Args('netId') netId: string): Promise<GetNetResponse> {
    try {
      /**
       * TODO:
       *  Set players for team A and team B
       */
      const netExist = await this.netService.findOne({ _id: netId });
      if (!netExist) return AppResponse.notFound('Net');
      const matchExist = await this.matchService.findOne({_id: netExist.match});
      if (!matchExist) return AppResponse.notFound('Match');
      const teamIds = [];
      if (matchExist?.teamA) teamIds.push(matchExist.teamA);
      if (matchExist?.teamB) teamIds.push(matchExist.teamB);

      await Promise.all([
        this.netService.updateOne({ _id: netId }, input),
        this.teamService.updateOne({ _id: { $in: teamIds } }, { $push: { nets: netId } }),
      ]);

      return {
        data: netExist,
        code: HttpStatus.ACCEPTED,
        message: 'Net has been updated successfully!',
        success: true,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((_returns) => GetNetsResponse)
  async updateNets(
    @Args('input', { type: () => [UpdateMultipleNetInput] }) netsInput: UpdateMultipleNetInput[],
  ): Promise<GetNetsResponse> {
    try {
      const netIds = netsInput.map((net) => net._id);
      const netsToUpdate = netsInput.map(({ _id, ...updateData }) => ({
        updateData,
        _id,
      }));

      const updatedNets = await this.bulkUpdateNets(netsToUpdate);
      await this.updateRelatedTeams(netIds);

      return {
        data: updatedNets,
        code: HttpStatus.ACCEPTED,
        message: 'Multiple nets have been updated successfully!',
        success: true,
      };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async bulkUpdateNets(netsToUpdate: { updateData: any; _id: string }[]): Promise<any[]> {
    const updatePromises = netsToUpdate.map(({ updateData, _id }) => this.netService.updateOne({ _id }, updateData));

    return await Promise.all(updatePromises);
  }

  private async updateRelatedTeams(netIds: string[]): Promise<void> {
    const netsWithMatches = await this.netService.findNetsWithMatches(netIds);

    const teamUpdates = netsWithMatches.flatMap((net) => {
      const teamIds = [];
      const netMatch: any = net?.match;
      if (netMatch?.teamA) teamIds.push(netMatch?.teamA);
      if (netMatch?.teamB) teamIds.push(netMatch?.teamB);
      return teamIds.map((teamId) => this.teamService.updateOne({ _id: teamId }, { $push: { nets: net._id } }));
    });

    await Promise.all(teamUpdates);
  }

  @Query((_returns) => GetNetsResponse)
  async getNets(@Args('roundId') roundId: string) {
    try {
      return {
        code: HttpStatus.OK,
        success: true,
        data: (await this.netService.find({ round: roundId })) || [],
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Query((_returns) => Net)
  async getNet(@Args('netId') netId: string) {
    try {
      return {
        code: HttpStatus.OK,
        success: true,
        data: await this.netService.findById(netId),
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  /**
   * POPULATE
   * ===============================================================================================
   */

  @ResolveField((_returns) => Round)
  async round(@Parent() net: Net) {
    try {
      return this.roundService.findById(net.round.toString());
    } catch {
      return null;
    }
  }
}
