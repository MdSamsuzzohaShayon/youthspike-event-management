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
import { FilterQuery } from 'mongoose';
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
  @Mutation((returns) => GetGroupResponse)
  async createGroup(@Context() context: any, @Args('input') input: CreateGroupInput): Promise<GetGroupResponse> {
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
        this.teamService.updateMany({ _id: { $in: input.teams } }, { group: newGroup._id }),
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
  @Mutation((_returns) => GetGroupResponse)
  async updateGroup(
    @Context() context: any,
    @Args('updateInput') updateInput: UpdateGroupInput,
    @Args('eventId', { nullable: true }) eventId?: string,
  ): Promise<GetGroupResponse> {
    try {
      /**
       * TODO:
       *  Step-1: Get user id from token if not logged in as admin
       */
      const updatePromises = [];
      // Update team
      if (updateInput.teams.length > 0) {
        for (const team of updateInput.teams) {
          const teamExist = await this.teamService.findOne({ _id: team });
          if (teamExist && teamExist.group) {
            updatePromises.push(
              this.groupService.updateOne({ _id: teamExist.group }, { $pull: { teams: teamExist._id } }),
            );
          }
          updatePromises.push(this.teamService.updateOne({ _id: team }, { group: updateInput._id }));
        }
      }
      updatePromises.push(
        this.groupService.updateOne({ _id: updateInput._id }, { $addToSet: { teams: { $each: updateInput.teams } } }),
      );

      await Promise.all(updatePromises);
      const findGroup = await this.groupService.findOne({ _id: updateInput._id });

      return {
        data: findGroup,
        success: true,
        message: 'Group has been updated successfully.',
        code: HttpStatus.ACCEPTED,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Query((returns) => GetGroupsResponse)
  async getGroups(@Context() context: any, @Args('eventId', { nullable: true }) eventId?: string) {
    try {
      const queryParams: FilterQuery<Group> = {};
      if (eventId) queryParams.event = eventId;
      const groupList = await this.groupService.find({});
      return {
        code: HttpStatus.OK,
        success: true,
        data: groupList,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Query((returns) => GetGroupResponse)
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
    const teamList = await this.teamService.find({ _id: { $in: group.teams } });
    return teamList;
  }

  @ResolveField()
  async matches(@Parent() group: Group) {
    const matchList = await this.matchService.find({ _id: { $in: group.matches } });
    return matchList;
  }

  @ResolveField()
  async event(@Parent() group: Group) {
    const eventExist = await this.eventService.findOne({ _id: group.event.toString() });
    return eventExist;
  }
}
