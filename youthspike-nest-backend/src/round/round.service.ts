import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { Round } from 'src/round/round.schema';

@Injectable()
export class RoundService {
  constructor(@InjectModel(Round.name) private roundModel: Model<Round>) { }

  async create(round: Round) {
    const newRound = await this.roundModel.create({ ...round });
    return newRound;
  }

  async createMany(rounds: Round[]) {
    const newRounds = await this.roundModel.insertMany(rounds);
    return newRounds;
  }


  async updateOne(filter: QueryFilter<Round>, updateData: UpdateQuery<Round>) {
    return this.roundModel.updateOne(filter, updateData);
  }

  async updateMany(filter: QueryFilter<Round>, updateData: UpdateQuery<Round>) {
    return this.roundModel.updateMany(filter, updateData);
  }

  async countDocuments(query: QueryFilter<Round>) {
    return this.roundModel.countDocuments(query);
  }

  async query(query: QueryFilter<Round>) {
    return this.roundModel.find(query).sort({
      num: 1,
    });
  }

  async find(filter: QueryFilter<Round>, limit?: number, offset?: number) {
    let query = this.roundModel.find(filter).sort({ num: 1 }); // always sort for stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    return query.lean().exec();
  }

  async findOne(query: QueryFilter<Round>) {
    return this.roundModel.findOne(query).sort({
      updatedAt: -1,
    });
  }

  async findById(id: string) {
    return this.roundModel.findById(id);
  }

  async delete(filter: QueryFilter<Round>) {
    return this.roundModel.deleteMany(filter);
  }

  async deleteMany(filter: QueryFilter<Round>) {
    return this.roundModel.deleteMany(filter);
  }
  
}
