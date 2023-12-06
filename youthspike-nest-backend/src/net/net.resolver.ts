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
  constructor(private roundService: RoundService, private netService: NetService) {}

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
  async updateNet(@Args('input') input: UpdateNetInput): Promise<GetNetResponse> {
    try {
      /**
       * TODO:
       */
      return {
        data: null,
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
  async getNet(@Args('id') id: string) {
    try {
      return {
        code: 200,
        success: true,
        data: await this.netService.findById(id),
      };
    } catch (err) {
      return AppResponse.getError(err);
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

  @ResolveField((returns) => User)
  async teamAPlayerA(@Parent() net: Net) {
    try {
      return null; // find player
    } catch {
      return null;
    }
  }

  @ResolveField((returns) => User)
  async teamAPlayerB(@Parent() net: Net) {
    try {
      return; // find player
    } catch {
      return null;
    }
  }

  @ResolveField((returns) => User)
  async teamBPlayerA(@Parent() net: Net) {
    try {
      return; // find player
    } catch {
      return null;
    }
  }

  @ResolveField((returns) => User)
  async teamBPlayerB(@Parent() net: Net) {
    try {
      return; // find player
    } catch {
      return null;
    }
  }
}
