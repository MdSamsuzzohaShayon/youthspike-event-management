import { Injectable } from '@nestjs/common';
import { Player } from '../player.schema';
import { EventService } from 'src/event/event.service';
import { Event } from 'src/event/event.schema';
import { TeamService } from 'src/team/team.service';
import { UserService } from 'src/user/user.service';
import { Team } from 'src/team/team.schema';
import { User } from 'src/user/user.schema';

@Injectable()
export class PlayerFields {
  constructor(
    private readonly eventService: EventService,
    private readonly teamService: TeamService,
    private readonly userService: UserService,
) {}

  async events(player: Player): Promise<Event[]> {
    try {
      if (!player.events) return [];
      const findEvents = await this.eventService.find({ _id: { $in: player.events } });
      return findEvents;
    } catch (error) {
      return [];
    }
  }
  // Do this for team and net as well

  async teams(player: Player): Promise<Team[]> {
    try {
      if (!player.teams) return null;
      const findTeams = await this.teamService.find({ _id: { $in: player.teams } });
      return findTeams;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async captainofteams(player: Player): Promise<Team[]> {
    try {
      if (!player.captainofteams) return null;
      const findTeams = await this.teamService.find({ _id: { $in: player.captainofteams } });
      return findTeams;
    } catch (error) {
      return null;
    }
  }

  async cocaptainofteams(player: Player): Promise<Team[]> {
    try {
      if (!player.cocaptainofteams) return null;
      const findTeams = await this.teamService.find({ _id: { $in: player.cocaptainofteams } });
      return findTeams;
    } catch (error) {
      return null;
    }
  }

  async captainuser(player: Player): Promise<User | null> {
    try {
      if (!player.captainuser) return null;
      const findUser = await this.userService.findById(player.captainuser.toString());
      return findUser;
    } catch (error) {
      return null;
    }
  }

  async cocaptainuser(player: Player): Promise<User | null> {
    try {
      if (!player.cocaptainuser) return null;
      const findUser = await this.userService.findById(player.cocaptainuser.toString());
      return findUser;
    } catch (error) {
      return null;
    }
  }
}
