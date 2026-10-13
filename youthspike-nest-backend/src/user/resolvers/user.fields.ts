import { Injectable } from '@nestjs/common';
import { GroupService } from 'src/group/group.service';
import { EventService } from 'src/event/event.service';
import { PlayerRanking, PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { PlayerService } from 'src/player/player.service';
import { Player } from 'src/player/player.schema';
import { Match } from 'src/match/match.schema';
import { MatchService } from 'src/match/match.service';
import { User } from '../user.schema';

@Injectable()
export class UserFields {
  constructor(
    private playerService: PlayerService,
  ) { }

  
  async captainplayer(user: User) {
    try {
      if (user.captainplayer) {
        const captain = await this.playerService.findById(user.captainplayer.toString());
        return captain || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }


  
  async cocaptainplayer(user: User) {
    try {
      if (user.cocaptainplayer) {
        const cocaptain = await this.playerService.findById(user.cocaptainplayer.toString());
        return cocaptain || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}
