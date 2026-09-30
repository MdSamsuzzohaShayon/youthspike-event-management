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
import { getId } from 'src/utils/helper';

@ObjectType()
class GetGroupsResponse extends AppResponse<Group[]> {
  @Field((_type) => [Group], { nullable: false })
  data?: Group[];
}

@ObjectType()
class GetGroupResponse extends AppResponse<Group> {
  @Field((_type) => Group, { nullable: true })
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

  // Helpers
  /**
  * Helper to synchronize team and group relationships efficiently.
  * Preserves the required sequence of operations (pull before push) to avoid 
  * MongoDB race conditions, while parallelizing operations across different 
  * collections to improve time and space complexity.
  */
  private async syncTeamGroupRelations(eventId: string, groupId: string, newTeamIds: string[]): Promise<void> {
    const groups = await this.groupService.find({event: eventId});
    const groupSet = new Set([groupId]);
    if(groups.length){
      for (const group of groups) {
        if(group){
          groupSet.add(String(group._id));
        }
      }
    }
    // 1. Break existing relationships (Parallelized across different collections)
    // Removes groupId from any of the newTeams' groups array
    // Removes any of the newTeams from the group's teams array
    await Promise.all([
      // Remove all groups of the event
      this.teamService.updateMany(
        { _id: { $in: newTeamIds } },
        { $pull: { groups: {$in: [...groupSet]} } }
      ),
      // Remove all teams of the event
      this.groupService.updateMany(
        { _id: {$in: [...groupSet]} },
        { $pull: { teams: { $in: newTeamIds } } }
      ),
    ]);

    // 2. Build new relationships (Parallelized across different collections)
    // Adds groupId to the newTeams' groups array
    // Adds newTeams to the group's teams array
    await Promise.all([
      this.teamService.updateMany(
        { _id: { $in: newTeamIds } },
        { $addToSet: { groups: groupId } }
      ),
      this.groupService.updateOne(
        { _id: groupId },
        { $addToSet: { teams: newTeamIds } }
      ),
    ]);
  }


  /**
  * Helper to remove team and group relationships efficiently.
  * Pulls the specified teams from all groups in the event and 
  * removes the event's groups from the specified teams.
  */
  private async removeTeamGroupRelations(eventId: string, groupId: string, removeTeamIds: string[]): Promise<void> {
    const groups = await this.groupService.find({ event: eventId });
    const groupSet = new Set<string>([groupId]);
    
    if (groups.length) {
      for (const group of groups) {
        if (group) {
          groupSet.add(String(group._id));
        }
      }
    }

    await Promise.all([
      // Remove teams from all groups of the event
      this.groupService.updateMany(
        { _id: { $in: [...groupSet] } },
        { $pull: { teams: { $in: removeTeamIds } } }
      ),
      // Remove all groups of the event from the teams being removed
      this.teamService.updateMany(
        { _id: { $in: removeTeamIds } },
        { $pull: { groups: { $in: [...groupSet] } } }
      ),
    ]);
  }



  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => GetGroupResponse)
  async createGroup(@Args('input') input: CreateGroupInput): Promise<GetGroupResponse> {
    try {
      /**
       * TODO:
       *  Step-1: Get user id from token if not logged in as admin
       */

      const groupExist = await this.groupService.findOne({
        name: {
          $regex: `^${input.name}$`,
          $options: 'i',
        },
        event: input.event,
      });
      if (groupExist) {
        return AppResponse.handleError({
          code: 406,
          success: false,
          message: 'There is already a group exist with this name in this event!',
        });
      }

      const groupObj = { ...input, matches: [] };
      if (input.matches) groupObj.matches;
      const newGroup = await this.groupService.create(groupObj);
      // Update teams and event
      await Promise.all([
        this.eventService.updateOne({ _id: getId(newGroup.event) }, { $addToSet: { groups: newGroup._id } }),
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
      const { _id: groupId, teams: newTeamIds, removeteams, ...restUpdateData } = updateInput;

      // ✅ Step 1: Validate Group
      const existingGroup = await this.groupService.findOne({ _id: groupId });
      if (!existingGroup) return AppResponse.notFound("Group");

      if (updateInput.name) {
        const groupNameExist = await this.groupService.findOne({
          name: {
            $regex: `^${updateInput.name}$`,
            $options: 'i',
          },
          event: eventId,
        });
        if (groupNameExist) {
          return AppResponse.handleError({
            code: 406,
            success: false,
            message: 'There is already a group exist with this name in this event!',
          });
        }
      }

      // ✅ Step 2: Validate Event (use eventId if provided)
      const targetEventId = eventId || existingGroup.event;

      const event = await this.eventService.findOne({ _id: getId(targetEventId) });
      if (!event) return AppResponse.notFound("Event");

      // ✅ Step 3: Prepare groupIds to remove (other groups in same event)
      const otherGroupIds = event.groups
        .filter((g) => String(g) !== String(groupId)) as string[];

      const updateOperations: Promise<any>[] = [];

      // ✅ Step 4: Handle Teams in BULK (no loop queries)
      if (newTeamIds?.length) {
        await this.syncTeamGroupRelations(eventId, groupId, newTeamIds);
      }

      if (removeteams?.length) {
        await this.removeTeamGroupRelations(eventId, groupId, removeteams);
      }

      // ✅ Step 5: Update group fields
      if (Object.entries(restUpdateData).length > 0) {
        updateOperations.push(
          this.groupService.updateOne(
            { _id: groupId },
            { $set: restUpdateData }
          )
        );
      }

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

      deletePromises.push(this.eventService.updateOne({ _id: getId(groupExist.event) }, { $pull: { group: groupId } }));
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
