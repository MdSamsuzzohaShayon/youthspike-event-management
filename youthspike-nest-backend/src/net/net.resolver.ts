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
import { CreateNetInput, UpdateNetInput } from './input.args';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/team/team.service';

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

  @Roles(UserRole.admin, UserRole.director, UserRole.captain)
  @Mutation((returns) => GetNetResponse)
  async createNet(@Args('input') input: CreateNetInput): Promise<GetNetResponse> {
    try {
      /**
       * TODO:
       */
      return {
        data: null,
        success: true,
        code: 201,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.director, UserRole.captain)
  @Mutation((returns) => GetNetResponse)
  async updateNet(@Args('input') input: UpdateNetInput, @Args('netId') netId: string): Promise<GetNetResponse> {
    try {
      /**
       * TODO:
       *  Set players for team A and team B
      */
      const findNetPromise: any = (await this.netService.findOne({_id: netId})).populate('match');
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

  @Roles(UserRole.admin, UserRole.director, UserRole.captain)
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

  @Roles(UserRole.admin, UserRole.director, UserRole.captain)
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
