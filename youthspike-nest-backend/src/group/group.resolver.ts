/* eslint-disable @typescript-eslint/no-unused-vars */
import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { UserRole } from 'src/user/user.schema';
import { Group, GroupPoints } from './group.schema';
import { GroupFields } from './resolvers/groups.fields';
import { GroupQueries } from './resolvers/groups.queries';
import { GroupMutations } from './resolvers/groups.mutations';
import { GetGroupPointsResponse, GetGroupResponse, GetGroupsPointsResponse, GetGroupsResponse } from './resolvers/groups.response';
import { CreateGroupInput, CreateGroupPointsInput, UpdateGroupInput, UpdateGroupPointsInput } from './resolvers/groups.input';



@Resolver((of) => Group)
export class GroupResolver {
  constructor(
    private groupFields: GroupFields,
    private groupQueries: GroupQueries,
    private groupMutations: GroupMutations,
  ) { }



  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => GetGroupResponse)
  async createGroup(@Args('input') input: CreateGroupInput): Promise<GetGroupResponse> {
    return this.groupMutations.createGroup(input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation(() => GetGroupResponse)
  async updateGroup(
    @Args('updateInput') updateInput: UpdateGroupInput,
    @Args('eventId', { nullable: true }) eventId?: string,
  ): Promise<GetGroupResponse> {
    return this.groupMutations.updateGroup(updateInput, eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => GetGroupResponse)
  async deleteGroup(
    @Context() context: any,
    @Args('groupId', { nullable: true }) groupId: string,
  ): Promise<GetGroupResponse> {
   return this.groupMutations.deleteGroup(context, groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation(() => GetGroupPointsResponse)
  async createGroupPoints(
    @Args('input') input: CreateGroupPointsInput,
  ): Promise<GetGroupPointsResponse> {
    return this.groupMutations.createGroupPoints(input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation(() => GetGroupPointsResponse)
  async updateGroupPoints(
    @Args('updateInput') updateInput: UpdateGroupPointsInput,
  ): Promise<GetGroupPointsResponse> {
    return this.groupMutations.updateGroupPoints(updateInput);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation(() => GetGroupPointsResponse)
  async deleteGroupPoints(
    @Args('groupPointsId') groupPointsId: string,
  ): Promise<GetGroupPointsResponse> {
    return this.groupMutations.deleteGroupPoints(groupPointsId);
  }

  @Query((_returns) => GetGroupsResponse)
  async getGroups(@Context() context: any, @Args('eventId', { nullable: true }) eventId?: string) {
    return this.groupQueries.getGroups(context, eventId);
  }

  @Query((_returns) => GetGroupResponse)
  async getGroup(@Args('groupId') groupId: string) {
    return this.groupQueries.getGroup(groupId);
  }

  @Query(() => GetGroupsPointsResponse)
  async getGroupsPoints(
    @Args('eventId', { nullable: true }) eventId?: string,
    @Args('teamId', { nullable: true }) teamId?: string,
  ) {
    return this.groupQueries.getGroupsPoints(eventId, teamId);
  }

  @Query(() => GetGroupPointsResponse)
  async getGroupPoints(@Args('teamId') teamId: string) {
    return this.groupQueries.getGroupPoints(teamId);
  }

  /**
   * POPULATE
   * ===============================================================================================
   */

  @ResolveField()
  async teams(@Parent() group: Group) {
    return this.groupFields.teams(group);
  }

  @ResolveField()
  async matches(@Parent() group: Group) {
    return this.groupFields.matches(group);
  }

  // @ResolveField()
  // async pointsEvent(@Parent() groupPoints: GroupPoints) {
  //   return this.groupFields.pointsEvent(groupPoints);
  // }
  
  @ResolveField(() => GroupPoints, { nullable: true })
  async pointsTeam(@Parent() groupPoints: GroupPoints) {
    return this.groupFields.pointsTeam(groupPoints);
  }


}
