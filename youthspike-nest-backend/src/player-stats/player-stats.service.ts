

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PlayerStats } from './player-stats.schema';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { EventService } from 'src/event/event.service';
import { ERosterLock } from 'src/event/event.schema';
import { checkDateHasPassed } from 'src/util/helper';

@Injectable()
export class PlayerStatsService {
  // constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}
  constructor(
    @InjectModel(PlayerStats.name) private playerStats: Model<PlayerStats>,
    private eventService: EventService,
  ) {}

  async create(input: PlayerStats) {
    const playerStats = await this.playerStats.create(input);
    return playerStats;
  }


  async findById(playerStatsId: string) {
    return this.playerStats.findById(playerStatsId);
  }

  async findOne(filter: FilterQuery<PlayerStats>) {
    return this.playerStats.findOne(filter);
  }

  async find(filter: FilterQuery<PlayerStats>) {
    return this.playerStats.find(filter);
  }

  async updateOne(filter: FilterQuery<PlayerStats>, updateObj: UpdateQuery<PlayerStats>) {
    return this.playerStats.updateOne(filter, updateObj);
  }

  async deleteOne(filter: FilterQuery<PlayerStats>) {
    return this.playerStats.deleteOne(filter);
  }

  async deleteMany(filter: FilterQuery<PlayerStats>) {
    return this.playerStats.deleteMany(filter);
  }

}
