import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroupService } from '../group.service';
import { TeamService } from 'src/team/team.service';
import { EventService } from 'src/event/event.service';
import { QueryFilter } from 'mongoose';
import { Group, GroupPoints } from '../group.schema';
import { AppResponse } from 'src/shared/response';

@Injectable()
export class GroupQueries {
  constructor(
    private configService: ConfigService,
    private eventService: EventService,
    private teamService: TeamService,
    private groupService: GroupService,
  ) { }


  async getGroups(context: any, eventId?: string) {
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


  async getGroupsPoints(eventId?: string, teamId?: string) {
    try {
      const filter: QueryFilter<GroupPoints> = {};
      if (eventId) filter.event = eventId;
      if (teamId) filter.team = teamId;

      const list = await this.groupService.pointsFind(filter);

      return {
        code: HttpStatus.OK,
        success: true,
        data: list,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getGroupPoints(teamId: string) {
    try {
      const found = await this.groupService.pointsFindOne({team: teamId});
      return {
        code: found ? HttpStatus.OK : HttpStatus.NOT_FOUND,
        success: !!found,
        data: found ?? null,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }
}
