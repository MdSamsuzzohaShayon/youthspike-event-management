/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { User, UserRole } from './user.schema';
import { Player } from 'src/player/player.schema';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { Roles } from 'src/shared/auth/roles.decorator';

import { FileUpload } from 'graphql-upload/processRequest.mjs';
import * as GraphQLUploadModule from 'graphql-upload/GraphQLUpload.mjs';
import { UpdateUser } from './resolvers/user.input';
import { LoginResponse, UserResponse } from './resolvers/user.response';
import { UserMutations } from './resolvers/user.mutations';
import { UserQueries } from './resolvers/user.queries';
import { UserFields } from './resolvers/user.fields';
const GraphQLUpload = GraphQLUploadModule.default;


@Resolver((_of) => User)
export class UserResolver {
  constructor(
    private readonly userMutations: UserMutations,
    private readonly userQueries: UserQueries,
    private readonly userFields: UserFields,
  ) { }



  @Mutation(() => LoginResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('passcode', { nullable: true }) passcode?: string,
  ): Promise<LoginResponse> {
    return this.userMutations.login(email, password, passcode)
  }





  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((_returns) => UserResponse)
  async updateUser(
    @Args({ name: 'userId', type: () => String, nullable: false }) userId: string,
    @Args('updateInput') updateInput: UpdateUser,
    @Args({ name: 'profile', type: () => GraphQLUpload, nullable: true }) profile?: Promise<FileUpload>,

  ) {
    return this.userMutations.updateUser(userId, updateInput, profile);
  }


  @Query((_returns) => UserResponse)
  async getUser(@Args('userId') userId: string) {
    return this.userQueries.getUser(userId);
  }

  /**
   * POPULATE
   * ===============================================================================================
   */
  @ResolveField(() => Player, { nullable: true })
  async captainplayer(@Parent() user: User) {
    return this.userFields.captainplayer(user);
  }

  @ResolveField(() => Player, { nullable: true })
  async cocaptainplayer(@Parent() user: User) {
    return this.userFields.cocaptainplayer(user);
  }
}
