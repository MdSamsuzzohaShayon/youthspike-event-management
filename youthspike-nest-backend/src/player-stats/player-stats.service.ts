

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PlayerStats, ProStats } from './player-stats.schema';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { EventService } from 'src/event/event.service';
import { ERosterLock } from 'src/event/event.schema';
import { checkDateHasPassed } from 'src/util/helper';

@Injectable()
export class PlayerStatsService {
  // constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}
  constructor(
    @InjectModel(PlayerStats.name) private playerStats: Model<PlayerStats>,
    @InjectModel(ProStats.name) private proStats: Model<ProStats>,
    private eventService: EventService,
  ) {}

  // Player stats
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

  // Player pro stats
  async proStatCreate(input: ProStats) {
    const proStats = await this.proStats.create(input);
    return proStats;
  }


  async proStatFindById(proStatsId: string) {
    return this.proStats.findById(proStatsId);
  }

  async proStatFindOne(filter: FilterQuery<ProStats>) {
    return this.proStats.findOne(filter);
  }

  async proStatFind(filter: FilterQuery<ProStats>) {
    return this.proStats.find(filter);
  }

  async proStatUpdateOne(filter: FilterQuery<ProStats>, updateObj: UpdateQuery<ProStats>) {
    return this.proStats.updateOne(filter, updateObj);
  }

  async proStatDeleteOne(filter: FilterQuery<ProStats>) {
    return this.proStats.deleteOne(filter);
  }

  async proStatDeleteMany(filter: FilterQuery<ProStats>) {
    return this.proStats.deleteMany(filter);
  }

}
