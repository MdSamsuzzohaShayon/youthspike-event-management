import { Injectable } from '@nestjs/common';
import { Parent } from '@nestjs/graphql';
import { LdoService } from 'src/ldo/ldo.service';
import { TeamService } from 'src/team/team.service';
import { SponsorService } from 'src/sponsor/sponsor.service';
import { PlayerService } from 'src/player/player.service';
import { MatchService } from 'src/match/match.service';
import { GroupService } from 'src/group/group.service';
import { Player } from 'src/player/player.schema';
import { Event } from '../event.schema';

@Injectable()
export class EventFields {
  constructor(
    private ldoService: LdoService,
    private teamService: TeamService,
    private sponsorService: SponsorService,
    private playerService: PlayerService,
    private matchService: MatchService,
    private groupService: GroupService,
  ) {}

  async ldo(@Parent() event: Event) {
    return this.ldoService.findByDirectorId(event.ldo.toString());
  }

  async teams(@Parent() event: Event) {
    try {
      // If not cached, fetch the teams from the database
      const teamList = await this.teamService.find({ _id: { $in: event.teams.map((t) => String(t)) } });

      return teamList;
    } catch (err) {
      // Handle errors gracefully
      console.error('Error resolving teams:', err);
      throw err; // Re-throw the error to be handled by GraphQL
    }
  }

  async groups(@Parent() event: Event) {
    try {
      const groupList = await this.groupService.find({ event: event._id.toString() });

      return groupList;
    } catch (err) {
      console.error('Error fetching groups:', err);
      throw new Error('Failed to fetch event groups');
    }
  }
  async sponsors(@Parent() event: Event) {
    return this.sponsorService.find({ _id: { $in: event.sponsors.map((s) => String(s)) } });
  }

  async players(@Parent() event: Event): Promise<Player[]> {
    try {
      const players = await this.playerService.find({ _id: { $in: event.players.map((p) => String(p)) } });

      return players;
    } catch (error) {
      // Handle errors gracefully
      console.error('Error resolving players:', error);
      return []; // Return an empty array in case of error
    }
  }

  async matches(@Parent() event: Event) {
    return this.matchService.find({ _id: { $in: event.matches.map(m => String(m)) } });
  }
}
