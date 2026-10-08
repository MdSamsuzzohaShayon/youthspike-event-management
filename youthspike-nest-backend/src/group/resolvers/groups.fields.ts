import { Injectable } from '@nestjs/common';
import { Parent } from '@nestjs/graphql';
import { TeamService } from 'src/team/team.service';
import { MatchService } from 'src/match/match.service';
import { Group, GroupPoints } from '../group.schema';
import { EventService } from 'src/event/event.service';
import { getId } from 'src/utils/helper';


@Injectable()
export class GroupFields {
  constructor(
    private eventService: EventService,
    private teamService: TeamService,
    private matchService: MatchService,
  ) {}

  async teams(@Parent() group: Group) {
    const teamList = await this.teamService.find({ _id: { $in: group.teams.map(g => String(g)) } });
    return teamList;
  }


  async matches(@Parent() group: Group) {
    const matchList = await this.matchService.find({ _id: { $in: group.matches.map(m => String(m)) } });
    return matchList;
  }


  async event(@Parent() group: Group) {
    const eventExist = await this.eventService.findOne({ _id: group.event.toString() });
    return eventExist;
  }

  // For group points
  async pointsTeam(@Parent() groupPoints: GroupPoints) {
    if (!groupPoints.team) return null;
    return this.teamService.findById(getId(groupPoints.team));
  }

  async pointsEvent(@Parent() groupPoints: GroupPoints) {
    if (!groupPoints.event) return null;
    return this.eventService.findOne({ _id: getId(groupPoints.event) });
  }
}
