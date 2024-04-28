import { Args, Field, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/shared/auth/roles.decorator';
import { AppResponse } from 'src/shared/response';
import { RoundService } from './round.service';
import { UserRole } from 'src/user/user.schema';
import { Round } from './round.schema';
import { UpdateRoundInput } from './round.input';
import { NetService } from 'src/net/net.service';
import { HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';

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
  constructor(private roundService: RoundService, private netService: NetService) { }

  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => CreateOrUpdateRoundResponse)
  async updateRound(@Args('updateInput') updateInput: UpdateRoundInput): Promise<CreateOrUpdateRoundResponse> {
    try {
      // const roundId = new Types.ObjectId(updateInput.roundId);
      const roundExist = await this.roundService.findById(updateInput.roundId);
      if (!roundExist) return AppResponse.notFound('Round');

      if (updateInput.subs && updateInput.subs.length > 0) {

        await this.roundService.updateMany(
          { num: { $gte: roundExist.num }, match: updateInput.matchId },
          { $set: { subs: updateInput.subs } },
        );
      }

      const findRound = await this.roundService.findById(updateInput.roundId);
      return {
        data: findRound,
        code: HttpStatus.ACCEPTED,
        success: true,
        message: 'Round has been updated successfully!',
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.director)
  @Query((returns) => GetRoundsResponse)
  async getRounds(@Args('matchId') matchId: string) {
    const rounds = await this.roundService.find({ match: matchId });
    try {
      return {
        code: HttpStatus.OK,
        success: true,
        data: rounds,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  /**
   * POPULATE
   * ===============================================================================================
   */

  @ResolveField((returns) => [Round])
  async nets(@Parent() round: Round) {
    try {
      return this.netService.query({ round: round._id.toString() });
    } catch {
      return [];
    }
  }
}
