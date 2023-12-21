import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Round } from 'src/round/round.schema';
import { SubService } from 'src/shared/services/sub.service';

@Injectable()
export class RoundService {
  constructor(@InjectModel(Round.name) private roundModel: Model<Round>, private subService: SubService) {}

  async create(round: Round) {
    const newRound = await this.roundModel.create({ ...round });
    return newRound;
  }

  async createMany(rounds: Round[]) {
    const newRounds = await this.roundModel.insertMany(rounds);
    return newRounds;
  }

  async update(round: Partial<Round>, id: string) {
    return this.roundModel.findOneAndUpdate(
      {
        _id: id,
      },
      round,
      { upsert: true, new: true },
    );
  }

  async countDocuments(query: FilterQuery<Round>) {
    return this.roundModel.countDocuments(query);
  }

  async query(query: FilterQuery<Round>) {
    return this.roundModel.find(query).sort({
      num: 1,
    });
  }

  async findOne(query: FilterQuery<Round>) {
    return this.roundModel.findOne(query).sort({
      updatedAt: -1,
    });
  }

  async findById(id: string) {
    return this.roundModel.findById(id);
  }

  async delete(filter: FilterQuery<Round>) {
    return this.roundModel.deleteMany(filter);
  }
}
