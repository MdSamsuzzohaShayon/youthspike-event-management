import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
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

  async update(round: UpdateQuery<Round>, id: string) {
    return this.roundModel.findOneAndUpdate(
      {
        _id: id,
      },
      round,
      { upsert: true, new: true },
    );
  }

  async updateOne(filter: FilterQuery<Round>, updateData: UpdateQuery<Round>) {
    return this.roundModel.updateOne(filter, updateData);
  }

  async updateMany(filter: FilterQuery<Round>, updateData: UpdateQuery<Round>) {
    return this.roundModel.updateMany(filter, updateData);
  }

  async countDocuments(query: FilterQuery<Round>) {
    return this.roundModel.countDocuments(query);
  }

  async query(query: FilterQuery<Round>) {
    return this.roundModel.find(query).sort({
      num: 1,
    });
  }

  async find(filter: FilterQuery<Round> = {}) {
    return this.roundModel.find(filter).sort({
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

  async deleteMany(filter: FilterQuery<Round>) {
    return this.roundModel.deleteMany(filter);
  }
  
}
