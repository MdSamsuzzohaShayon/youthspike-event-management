import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PlayerRanking, PlayerRankingItem } from './player-ranking.schema';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';

@Injectable()
export class PlayerRankingService {
  // constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}
  constructor(
    @InjectModel(PlayerRanking.name) private playerRanking: Model<PlayerRanking>,
    @InjectModel(PlayerRankingItem.name) private playerRankingItem: Model<PlayerRankingItem>,
  ) {}

  async create(rankingData: PlayerRanking) {
    const playerRanking = await this.playerRanking.create({ ...rankingData, rankings: [] });
    const rankingsRaw = await this.playerRankingItem.insertMany(
      rankingData.rankings.map((r) => ({ ...r, playerRanking: playerRanking._id })),
    );
    const rankingIds = rankingsRaw.map((rr) => rr._id);
    await this.playerRanking.updateOne({ _id: playerRanking._id }, { $set: { rankings: rankingIds } });
    return playerRanking;
  }

  async findById(playerRankingId: string) {
    return this.playerRanking.findById(playerRankingId);
  }

  async findOne(filter: FilterQuery<PlayerRanking>) {
    return this.playerRanking.findOne(filter);
  }

  async find(filter: FilterQuery<PlayerRanking>) {
    return this.playerRanking.find(filter);
  }

  async updateOne(filter: FilterQuery<PlayerRanking>, updateObj: UpdateQuery<PlayerRanking>) {
    return this.playerRanking.updateOne(filter, updateObj);
  }

  // ===== Item =====

  async findItems(filter: FilterQuery<PlayerRankingItem>) {
    return this.playerRankingItem.find(filter);
  }

  async insertManyItems(rankingItemData: PlayerRankingItem[]) {
    const rankingsItems = await this.playerRankingItem.insertMany(rankingItemData);
    const playerRankingId = rankingItemData[0].playerRanking;
    await this.playerRanking.updateOne(
      { _id: playerRankingId },
      { $addToSet: { rankings: { $each: rankingsItems.map((ri) => ri._id.toString()) } } }
    );
  }

  async updateOneItem(filter: FilterQuery<PlayerRankingItem>, updateObj: UpdateQuery<PlayerRankingItem>) {
    return this.playerRankingItem.updateOne(filter, updateObj);
  }

  async updateManyItems(filter: FilterQuery<PlayerRankingItem>, updateObj: UpdateQuery<PlayerRankingItem>) {
    return this.playerRankingItem.updateMany(filter, updateObj);
  }
}
