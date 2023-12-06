/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Field, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/shared/auth/roles.decorator';
import { AppResponse } from 'src/shared/response';
import { SubService } from 'src/shared/services/sub.service';
import { UserRole } from 'src/user/user.schema';
import { Sub } from './sub.schema';

@ObjectType()
class CreateOrUpdateSubResponse extends AppResponse<Sub> {
  @Field((type) => Sub, { nullable: true })
  data?: Sub;
}

@ObjectType()
class GetSubsResponse extends AppResponse<Sub[]> {
  @Field((type) => [Sub], { nullable: false })
  data?: Sub[];
}

@ObjectType()
class GetSubResponse extends AppResponse<Sub> {
  @Field((type) => Sub, { nullable: false })
  data?: Sub;
}

@Resolver((of) => Sub)
export class SubResolver {
  constructor(private subService: SubService) {}

  @Roles(UserRole.admin, UserRole.coach, UserRole.playerAndCoach)
  @Mutation((returns) => GetSubResponse)
  async subAddPlayer(@Args('id') id: string, @Args('roundId') roundId: string, @Args('playerId') playerId: string) {
    try {
      const sub = await this.subService.findOne({
        _id: id,
        roundId,
      });

      const existing = sub.players.find((i) => i == playerId);
      if (!existing) {
        sub.players.push(playerId);
        await sub.save();
      }

      return {
        code: 200,
        success: true,
        data: await this.subService.findById(id),
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.coach, UserRole.playerAndCoach)
  @Mutation((returns) => GetSubResponse)
  async subRemovePlayer(@Args('id') id: string, @Args('roundId') roundId: string, @Args('playerId') playerId: string) {
    try {
      const sub = await this.subService.findOne({
        _id: id,
        roundId,
      });

      const existing = sub.players.findIndex((i) => i == playerId);
      if (existing > -1) {
        sub.players.splice(existing, 1);
        await sub.save();
      }

      return {
        code: 200,
        success: true,
        data: await this.subService.findById(id),
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.coach, UserRole.playerAndCoach)
  @Query((returns) => GetSubResponse)
  async getSub(@Args('id') id: string) {
    try {
      return {
        code: 200,
        success: true,
        data: await this.subService.findById(id),
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @ResolveField()
  async playerObjects(@Parent() sub: Sub) {
    return null; // find player
  }
}
