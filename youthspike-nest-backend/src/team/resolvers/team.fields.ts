import { Injectable } from '@nestjs/common';
import { Team } from '../team.schema';
import { GroupService } from 'src/group/group.service';
import { EventService } from 'src/event/event.service';
import { PlayerRanking, PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { PlayerService } from 'src/player/player.service';
import { Player } from 'src/player/player.schema';
import { Match } from 'src/match/match.schema';
import { MatchService } from 'src/match/match.service';

@Injectable()
export class TeamFields {
  constructor(
    private groupService: GroupService,
    private eventService: EventService,
    private matchService: MatchService,
    private playerRankingService: PlayerRankingService,
    private playerService: PlayerService,
  ) { }

  async players(team: Team): Promise<Player[]> {
    try {
      // If not cached, fetch the players from the database
      const players = await this.playerService.find({ teams: { $in: [team._id.toString()] } });

      return players;
    } catch (error) {
      // Handle errors gracefully
      console.error('Error resolving players:', error);
      return []; // Return an empty array in case of error
    }
  }

  async moved(team: Team): Promise<Player[]> {
    try {
      // If not cached, fetch the players from the database
      const players = await this.playerService.find({ prevteams: { $in: [team._id.toString()] } });

      return players;
    } catch (error) {
      // Handle errors gracefully
      console.error('Error resolving players:', error);
      return []; // Return an empty array in case of error
    }
  }

  async playerRanking(team: Team): Promise<PlayerRanking> {
    try {
      const playerRanking = await this.playerRankingService.findOne({
        team: team._id,
        // rankLock: false,
        $or: [
          { match: { $exists: false } }, // `match` is undefined
          { match: null }, // `match` is null
        ],
      }); // For secific match a rank will be locked
      return playerRanking;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async rankings(team: Team): Promise<PlayerRankingItem[]> {
    try {
      const pr = await this.playerRankingService.findOne({
        $or: [
          { match: { $exists: false } }, // `match` is undefined
          { match: null }, // `match` is null
        ],
        team: team._id,
      });
      const rankingItems = await this.playerRankingService.findItems({ _id: { $in: pr.rankings.map(p => String(p)) } });

      // Ensure rank is not null for any item
      return rankingItems.map((item) => {
        if (item.rank === null) {
          item.rank = -1; // or some default value
        }
        return item;
      });
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async player(pri: PlayerRankingItem): Promise<Player> {
    try {
      return this.playerService.findById(pri.player.toString());
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async captain(team: Team) {
    try {
      if (team.captain) {
        const captain = await this.playerService.findById(team.captain.toString());
        return captain || null; // Return null if captain is not found
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async cocaptain(team: Team) {
    try {
      if (team.cocaptain) {
        const cocaptain = await this.playerService.findById(team.cocaptain.toString());
        return cocaptain || null; // Return null if cocaptain is not found
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async events(team: Team) {
    try {
      const events = await this.eventService.find({ _id: { $in: team.events as string[] } });
      return events;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async groups(team: Team) {
    const groupExist = await this.groupService.find({ _id: {$in: team.groups as string[]}});
    return groupExist;
  }

  async matches(team: Team): Promise<Match[]> {
    try {
      const matches = await this.matchService.find({
        $or: [{ teamA: team._id.toString() }, { teamB: team._id.toString() }],
      });
      return matches;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}
