/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Field, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/shared/auth/roles.decorator';
import { AppResponse } from 'src/shared/response';
import { RoundService } from './round.service';
import { UserRole } from 'src/user/user.schema';
import { Round } from './round.schema';
import { UpdateRoundInput } from './round.input';
import { Match } from 'src/match/match.schema';
import { NetService } from 'src/net/net.service';

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
    private netService: NetService,
  ) { }

  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => CreateOrUpdateRoundResponse)
  async updateRound(
    @Args("updateInput") updateInput: UpdateRoundInput
  ): Promise<CreateOrUpdateRoundResponse> {
    try {
      const roundExist = await this.roundService.findById(updateInput.roundId);
      if (!roundExist) return AppResponse.exists("Round");

      if (updateInput.subs && updateInput.subs.length > 0) {
        await this.roundService.updateOne({ _id: { $gte: roundExist.num } }, { $set: { subs: updateInput.subs } });
      }

      const findRound = await this.roundService.findById(updateInput.roundId);
      return {
        data: findRound,
        success: true,
        code: 200,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.director)
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

  @Roles(UserRole.admin, UserRole.director)
  @Query((returns) => GetRoundResponse)
  async getRound(@Args('roundId') roundId: string) {
    try {
      return {
        code: 200,
        success: true,
        data: await this.roundService.findById(roundId),
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @ResolveField((returns) => [Round])
  async nets(@Parent() round: Round) {
    try {
      return this.netService.query({ round: round._id.toString() });
    } catch {
      return [];
    }
  }
}
