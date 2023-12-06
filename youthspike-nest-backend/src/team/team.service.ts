import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Team } from 'src/team/team.schema';
import { Types } from 'mongoose';

@Injectable()
export class TeamService {
  constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}

  async query(filter: FilterQuery<Team>) {
    return this.teamModel.find(filter).sort({ name: 1 });
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.teamModel.findById(id);
  }

  async findByName(name: string) {
    if (!name) return null;
    return this.teamModel.findOne({ name });
  }

  async findOne(filter: FilterQuery<Team>) {
    return this.teamModel.findOne(filter);
  }

  async create(team: Team) {
    return this.teamModel.create({
      ...team,
      active: true,
    });
  }

  async update(team: Partial<Team>, filter: FilterQuery<Team>) {
    const teamObj = { ...team };
    return this.teamModel.findOneAndUpdate(filter, teamObj, { upsert: true, new: true });
  }
}
