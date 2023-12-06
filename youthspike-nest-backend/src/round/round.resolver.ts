/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Field, Int, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Match } from 'src/match/match.schema';
import { Net } from 'src/net/net.schema';
import { Roles } from 'src/shared/auth/roles.decorator';
import { AppResponse } from 'src/shared/response';
import { MatchService } from 'src/match/match.service';
import { NetService } from 'src/net/net.service';
import { RoundService } from './round.service';
import { SubService } from 'src/shared/services/sub.service';
import { Sub } from 'src/sub/sub.schema';
import { UserRole } from 'src/user/user.schema';
import { Round } from './round.schema';

@ObjectType()
class CreateOrUpdateRoundResponse extends AppResponse<Round> {
  @Field((type) => Round, { nullable: true })
  data?: Round;
}

@ObjectType()
class GetRoundsResponse extends AppResponse<Round[]> {
  @Field((type) => [Round], { nullable: false })
  data?: Round[];
}

@ObjectType()
class GetRoundResponse extends AppResponse<Round> {
  @Field((type) => Round, { nullable: false })
  data?: Round;
}

@Resolver((of) => Round)
export class RoundResolver {
  constructor(
    private roundService: RoundService,
    private matchService: MatchService,
    private netService: NetService,
    private subService: SubService,
  ) {}

  @Roles(UserRole.admin, UserRole.coach, UserRole.playerAndCoach)
  @Mutation((returns) => GetRoundResponse)
  async create(
    @Args('match') match: string,
    @Args('locked', { nullable: true })
    locked?: boolean,
    @Args('id', { nullable: true }) id?: string,
  ): Promise<CreateOrUpdateRoundResponse> {
    try {
      // Create Match, rounds, nets

      return {
        data: null,
        success: true,
        code: 200,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.coach, UserRole.playerAndCoach)
  @Mutation((returns) => CreateOrUpdateRoundResponse)
  async updateRound(
    @Args('matchId') matchId: string,
    @Args('locked', { nullable: true })
    locked?: boolean,
    @Args('id', { nullable: true }) id?: string,
  ): Promise<CreateOrUpdateRoundResponse> {
    try {
      // Update

      return {
        data: null,
        success: true,
        code: 200,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.coach, UserRole.playerAndCoach)
  @Query((returns) => GetRoundsResponse)
  async getRounds(@Args('matchId') matchId: string) {
    try {
      return {
        code: 200,
        success: true,
        data:
          (await this.roundService.query({
            matchId,
          })) || [],
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.coach, UserRole.playerAndCoach)
  @Query((returns) => GetRoundResponse)
  async getRound(@Args('id') id: string) {
    try {
      return {
        code: 200,
        success: true,
        data: await this.roundService.findById(id),
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @ResolveField((returns) => Match)
  async match(@Parent() round: Round) {
    try {
      return this.matchService.findById(round.match.toString());
    } catch {
      return null;
    }
  }

  @ResolveField((returns) => [Net])
  async nets(@Parent() round: Round) {
    try {
      return this.netService.query({
        roundId: round._id,
      });
    } catch {
      return null;
    }
  }

  @ResolveField((returns) => Sub)
  async sub(@Parent() round: Round) {
    try {
      return this.subService
        .findOne({
          roundId: round._id,
        })
        .then((r) => {
          return r;
        });
    } catch {
      return null;
    }
  }
}
