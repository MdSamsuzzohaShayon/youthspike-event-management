import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PlayerRanking, PlayerRankingItem } from './player-ranking.schema';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { EventService } from 'src/event/event.service';
import { ERosterLock } from 'src/event/event.schema';
import { checkDateHasPassed } from 'src/utils/helper';

@Injectable()
export class PlayerRankingService {
  // constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}
  constructor(
    @InjectModel(PlayerRanking.name) private playerRanking: Model<PlayerRanking>,
    @InjectModel(PlayerRankingItem.name) private playerRankingItem: Model<PlayerRankingItem>,
    private eventService: EventService,
  ) {}

  async lockPlayerRanking(teamId: string, eventId: string) {
    let locked = false;
    const [eventExist, playerRankings] = await Promise.all([
      this.eventService.findOne({ _id: eventId }),
      this.playerRanking.find({
        $and: [{ team: teamId }, { $or: [{ match: null }, { match: { $exists: false } }] }],
      }),
    ]);
    if (eventExist.rosterLock !== ERosterLock.FIRST_ROSTER_SUBMIT) {
      // Check the date has passed or not
      const datePassed = checkDateHasPassed(eventExist.rosterLock);
      if (datePassed) {
        const updatePromises = [];
        for (const playerRanking of playerRankings) {
          if (!playerRanking.rankLock) {
            locked = true;
            updatePromises.push(this.playerRanking.updateOne({ _id: playerRanking._id }, { $set: { rankLock: true } }));
          }
        }
        if (updatePromises.length > 0) await Promise.all(updatePromises);
      }
    }
    return locked;
  }

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

  async findOne(filter: QueryFilter<PlayerRanking>) {
    return this.playerRanking.findOne(filter);
  }


  async find(
    filter: QueryFilter<PlayerRanking>,
    limit?: number,
    offset?: number, // added for consistency & scalability
  ) {
    let query = this.playerRanking.find(filter); // ensures stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }
    return query.lean().exec();
  }

  async updateOne(filter: QueryFilter<PlayerRanking>, updateObj: UpdateQuery<PlayerRanking>) {
    return this.playerRanking.updateOne(filter, updateObj);
  }

  async updateMany(filter: QueryFilter<PlayerRanking>, updateObj: UpdateQuery<PlayerRanking>) {
    return this.playerRanking.updateMany(filter, updateObj);
  }

  async deleteOne(filter: QueryFilter<PlayerRanking>) {
    const deleteRanking = await this.playerRanking.findOne(filter);
    if (deleteRanking && deleteRanking?._id) {
      await this.playerRankingItem.deleteMany({ playerRanking: deleteRanking._id });
    }
    return this.playerRanking.deleteOne(filter);
  }

  // ===== Item =====
  async createAnItem(playerRankingItem: PlayerRankingItem) {
    // Need to work with it
    const newPlayerRankingItem = await this.playerRankingItem.create(playerRankingItem);
    await this.playerRanking.updateOne(
      { _id: playerRankingItem.playerRanking.toString() },
      { $addToSet: { rankings: newPlayerRankingItem._id } },
    );
    return newPlayerRankingItem;
  }

  async findItems(filter: QueryFilter<PlayerRankingItem>) {
    const rankingItemList = await this.playerRankingItem.find(filter);
    return rankingItemList;
  }

  // async insertManyItems(rankingItemData: PlayerRankingItem[]) {
  //   const rankingsItems = await this.playerRankingItem.insertMany(rankingItemData);
  //   const playerRankingId = rankingItemData[0].playerRanking;
  //   await this.playerRanking.updateOne(
  //     { _id: playerRankingId },
  //     { $addToSet: { rankings: { $each: rankingsItems.map((ri) => ri._id.toString()) } } },
  //   );
  // }

  async insertManyItems(rankingItemData: PlayerRankingItem[]) {
    const rankingsItems = await this.playerRankingItem.insertMany(rankingItemData);
    return rankingsItems;
  }


  async deletMany(filter: QueryFilter<PlayerRanking>) {
    return this.playerRanking.deleteMany(filter);
  }

  async updateOneItem(filter: QueryFilter<PlayerRankingItem>, updateObj: UpdateQuery<PlayerRankingItem>) {
    return this.playerRankingItem.updateOne(filter, updateObj);
  }

  async updateManyItems(filter: QueryFilter<PlayerRankingItem>, updateObj: UpdateQuery<PlayerRankingItem>) {
    return this.playerRankingItem.updateMany(filter, updateObj);
  }

  async deleteOneItem(filter: QueryFilter<PlayerRankingItem>) {
    return this.playerRankingItem.deleteOne(filter);
  }

  async findOneItem(filter: QueryFilter<PlayerRankingItem>) {
    return this.playerRankingItem.findOne(filter);
  }
  async deleteManyItem(filter: QueryFilter<PlayerRankingItem>) {
    return this.playerRankingItem.deleteMany(filter);
  }
}
