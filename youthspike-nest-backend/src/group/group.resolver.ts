/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Context, Field, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { AppResponse } from 'src/shared/response';
import { UserRole } from 'src/user/user.schema';
import { TeamService } from 'src/team/team.service';
import { ConfigService } from '@nestjs/config';
import { Group } from './group.schema';
import { CreateGroupInput, UpdateGroupInput } from './group.input';
import { GroupService } from './group.service';
import { EventService } from 'src/event/event.service';
import { QueryFilter, UpdateQuery } from 'mongoose';
import { MatchService } from 'src/match/match.service';

@ObjectType()
class GetGroupsResponse extends AppResponse<Group[]> {
  @Field((_type) => [Group], { nullable: false })
  data?: Group[];
}

@ObjectType()
class GetGroupResponse extends AppResponse<Group> {
  @Field((_type) => Group, { nullable: false })
  data?: Group;
}

@Resolver((of) => Group)
export class GroupResolver {
  constructor(
    private configService: ConfigService,
    private teamService: TeamService,
    private groupService: GroupService,
    private eventService: EventService,
    private matchService: MatchService,
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => GetGroupResponse)
  async createGroup(@Args('input') input: CreateGroupInput): Promise<GetGroupResponse> {
    try {
      /**
       * TODO:
       *  Step-1: Get user id from token if not logged in as admin
       */
      const groupObj = { ...input, matches: [] };
      if (input.matches) groupObj.matches;
      const newGroup = await this.groupService.create(groupObj);
      // Update teams and event
      await Promise.all([
        this.eventService.updateOne({ _id: newGroup.event }, { $addToSet: { groups: newGroup._id } }),
        this.teamService.updateMany({ _id: { $in: input.teams } }, { $addToSet: { groups: newGroup._id } }),
      ]);

      return {
        data: newGroup,
        success: true,
        message: 'Group has been created successfully.',
        code: HttpStatus.CREATED,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation(() => GetGroupResponse)
  async updateGroup(
    @Args('updateInput') updateInput: UpdateGroupInput,
    @Args('eventId', { nullable: true }) eventId?: string,
  ): Promise<GetGroupResponse> {
    try {
      const { _id: groupId, teams: newTeamIds, ...restUpdateData } = updateInput;

      // ✅ Step 1: Validate Group
      const existingGroup = await this.groupService.findOne({ _id: groupId });
      if (!existingGroup) return AppResponse.notFound("Group");

      // ✅ Step 2: Validate Event (use eventId if provided)
      const targetEventId = eventId || existingGroup.event;

      const event = await this.eventService.findOne({ _id: targetEventId });
      if (!event) return AppResponse.notFound("Event");

      // ✅ Step 3: Prepare groupIds to remove (other groups in same event)
      const otherGroupIds = event.groups
        .filter((g) => String(g) !== String(groupId)) as string[];

      const updateOperations: Promise<any>[] = [];

      // ✅ Step 4: Handle Teams in BULK (no loop queries)
      if (newTeamIds?.length) {

        // 🔥 4.1 Remove teams from other groups (bulk)
        updateOperations.push(
          this.groupService.updateMany(
            { _id: { $in: otherGroupIds } },
            { $pull: { teams: { $in: newTeamIds } } }
          )
        );

        // 🔥 4.2 Remove old group references from teams
        updateOperations.push(
          this.teamService.updateMany(
            { _id: { $in: newTeamIds } },
            { $pull: { groups: { $in: otherGroupIds } } }
          )
        );

        // 🔥 4.3 Add new group to teams
        updateOperations.push(
          this.teamService.updateMany(
            { _id: { $in: newTeamIds } },
            { $addToSet: { groups: groupId } }
          )
        );

        // 🔥 4.4 Add teams to current group
        updateOperations.push(
          this.groupService.updateOne(
            { _id: groupId },
            { $addToSet: { teams: { $each: newTeamIds } } }
          )
        );
      }

      // ✅ Step 5: Update group fields
      updateOperations.push(
        this.groupService.updateOne(
          { _id: groupId },
          { $set: restUpdateData }
        )
      );

      // ✅ Execute all in parallel
      await Promise.all(updateOperations);

      const updatedGroup = await this.groupService.findOne({ _id: groupId });

      return {
        data: updatedGroup,
        success: true,
        message: 'Group has been updated successfully.',
        code: HttpStatus.ACCEPTED,
      };

    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => GetGroupResponse)
  async deleteGroup(
    @Context() context: any,
    @Args('groupId', { nullable: true }) groupId: string,
  ): Promise<GetGroupResponse> {
    try {
      const groupExist = await this.groupService.findById(groupId);
      if (!groupExist) {
        return AppResponse.notFound('Group');
      }
      // Teams, matches, event
      const deletePromises = [];
      if (groupExist.teams.length > 0) {
        deletePromises.push(
          this.teamService.updateMany(
            { _id: { $in: groupExist.teams.map(g => String(g)) } },
            { $pull: { groups: groupId } }),
        );
      }

      if (groupExist.matches.length > 0) {
        deletePromises.push(
          this.matchService.updateMany({ _id: { $in: groupExist.matches.map(m => String(m)) } }, { $pull: { group: groupId } }),
        );
      }

      deletePromises.push(this.eventService.updateOne({ _id: groupExist.event }, { $pull: { group: groupId } }));
      deletePromises.push(this.groupService.deleteOne({ _id: groupId }));

      await Promise.all(deletePromises);
      return {
        success: true,
        message: 'Group has been deleted successfully.',
        code: HttpStatus.NO_CONTENT,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Query((_returns) => GetGroupsResponse)
  async getGroups(@Context() context: any, @Args('eventId', { nullable: true }) eventId?: string) {
    try {
      const queryParams: QueryFilter<Group> = {};
      if (eventId) queryParams.event = eventId;
      const groupList = await this.groupService.find(queryParams);
      return {
        code: HttpStatus.OK,
        success: true,
        data: groupList,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Query((_returns) => GetGroupResponse)
  async getGroup(@Args('groupId') groupId: string) {
    try {
      const findGroup = await this.groupService.findById(groupId);
      return {
        code: findGroup ? HttpStatus.OK : HttpStatus.NOT_FOUND,
        success: findGroup ? true : false,
        data: findGroup ?? null,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  /**
   * POPULATE
   * ===============================================================================================
   */

  @ResolveField()
  async teams(@Parent() group: Group) {
    const teamList = await this.teamService.find({ _id: { $in: group.teams.map(g => String(g)) } });
    return teamList;
  }

  @ResolveField()
  async matches(@Parent() group: Group) {
    const matchList = await this.matchService.find({ _id: { $in: group.matches.map(m => String(m)) } });
    return matchList;
  }

  @ResolveField()
  async event(@Parent() group: Group) {
    const eventExist = await this.eventService.findOne({ _id: group.event.toString() });
    return eventExist;
  }
}
