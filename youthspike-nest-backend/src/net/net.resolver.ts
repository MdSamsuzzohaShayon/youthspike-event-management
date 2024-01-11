/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Field, Int, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Round } from 'src/round/round.schema';
import { Roles } from 'src/shared/auth/roles.decorator';
import { AppResponse } from 'src/shared/response';
import { NetService } from 'src/net/net.service';
import { RoundService } from 'src/round/round.service';
import { Team } from 'src/team/team.schema';
import { User, UserRole } from 'src/user/user.schema';
import { Net } from './net.schema';
import { CreateNetInput, UpdateMultipleNetInput, UpdateNetInput } from './input.args';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/team/team.service';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';

@ObjectType()
class GetNetsResponse extends AppResponse<Net[]> {
  @Field((type) => [Net], { nullable: false })
  data?: Net[];
}

@ObjectType()
class GetNetResponse extends AppResponse<Net> {
  @Field((type) => Net, { nullable: false })
  data?: Net;
}


@Resolver((of) => Net)
export class NetResolver {
  constructor(private roundService: RoundService, private netService: NetService, private teamService: TeamService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain)
  @Mutation((returns) => GetNetResponse)
  async updateNet(@Args('input') input: UpdateNetInput, @Args('netId') netId: string): Promise<GetNetResponse> {
    try {
      /**
       * TODO:
       *  Set players for team A and team B
      */
      const findNetPromise: any = (await this.netService.findOne({ _id: netId })).populate('match');
      const findNet = await findNetPromise;
      const teamIds = [];
      if (findNet.match?.teamA) teamIds.push(findNet.match.teamA);
      if (findNet.match?.teamB) teamIds.push(findNet.match.teamB);

      const updateNet = await this.netService.update(input, netId);
      const updateTeam = await this.teamService.update({ $push: { nets: updateNet._id } }, { _id: { $in: teamIds } });
      return {
        data: updateNet,
        success: true,
        code: 202,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }


  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.admin, UserRole.director, UserRole.captain)
  @Mutation((returns) => GetNetsResponse)
  async updateNets(@Args('input', { type: () => [UpdateMultipleNetInput] }) netsInput: UpdateMultipleNetInput[]): Promise<GetNetsResponse> {
      try {
          const netIds = netsInput.map(net => net._id);
          const netsToUpdate = netsInput.map(({ _id, ...updateData }) => ({
              updateData,
              _id,
          }));
  
          const updatedNets = await this.bulkUpdateNets(netsToUpdate);
          await this.updateRelatedTeams(netIds);
  
          return {
              data: updatedNets,
              success: true,
              code: HttpStatus.ACCEPTED,
          };
      } catch (err) {
          throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
  
  private async bulkUpdateNets(netsToUpdate: { updateData: any, _id: string }[]): Promise<any[]> {
      const updatePromises = netsToUpdate.map(({ updateData, _id }) => 
          this.netService.update(updateData, _id)
      );
  
      return await Promise.all(updatePromises);
  }
  
  private async updateRelatedTeams(netIds: string[]): Promise<void> {
      const netsWithMatches = await this.netService.findNetsWithMatches(netIds);
  
      const teamUpdates = netsWithMatches.flatMap(net => {
          const teamIds = [];
          const netMatch: any = net?.match;
          if (netMatch?.teamA) teamIds.push(netMatch?.teamA);
          if (netMatch?.teamB) teamIds.push(netMatch?.teamB);
          return teamIds.map(teamId => this.teamService.update({ $push: { nets: net._id } }, { _id: teamId }));
      });
  
      await Promise.all(teamUpdates);
  }

  @Query((returns) => GetNetsResponse)
  async getNets(@Args('roundId') roundId: string) {
    try {
      return {
        code: 200,
        success: true,
        data: (await this.netService.query({ roundId })) || [],
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Query((returns) => GetNetResponse)
  async getNet(@Args('netId') netId: string) {
    try {
      return {
        code: 200,
        success: true,
        data: await this.netService.findById(netId),
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }


  @ResolveField((returns) => Round)
  async teamA(@Parent() net: Net) {
    try {
      if (!net?.teamA) return null;
      return this.teamService.findById(net.teamA.toString());
    } catch {
      return null;
    }
  }

  @ResolveField((returns) => Round)
  async teamB(@Parent() net: Net) {
    try {
      if (!net?.teamB) return null;
      return this.teamService.findById(net.teamB.toString());
    } catch {
      return null;
    }
  }

  @ResolveField((returns) => Round)
  async round(@Parent() net: Net) {
    try {
      return this.roundService.findById(net.round.toString());
    } catch {
      return null;
    }
  }

}
