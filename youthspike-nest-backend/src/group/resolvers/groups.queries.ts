import { HttpStatus, Injectable } from '@nestjs/common';
import { GroupService } from '../group.service';
import { QueryFilter } from 'mongoose';
import { Group, GroupPoints } from '../group.schema';
import { AppResponse } from 'src/shared/response';
import { CustomGroupPoints, GetGroupPointsResponse, GetGroupsPointsResponse } from './groups.response';

@Injectable()
export class GroupQueries {
  constructor(
    private groupService: GroupService,
  ) { }


  async getGroups(_context: any, eventId?: string) {
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


  async getGroup(groupId: string) {
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


  async getGroupsPoints(eventId?: string, teamId?: string): Promise<GetGroupsPointsResponse> {
    try {
      const filter: QueryFilter<GroupPoints> = {};
      if (eventId) filter.event = eventId;
      if (teamId) filter.team = teamId;

      // Get last 10 items
      const grouppoints = await this.groupService.pointsFind(filter, 0, 10);

      return {
        code: HttpStatus.OK,
        success: true,
        message: "Getting all group points!",
        data: grouppoints as CustomGroupPoints[],
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getGroupPoints(teamId: string): Promise<GetGroupPointsResponse> {
    try {
      const found = await this.groupService.pointsFindOne({team: teamId});
      return {
        code: found ? HttpStatus.OK : HttpStatus.NOT_FOUND,
        success: !!found,
        
        data: found as CustomGroupPoints,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }
}
