import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { Team } from 'src/team/team.schema';

@Injectable()
export class TeamService {
  constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}

  async query(filter: FilterQuery<Team>) {
    return this.teamModel.find(filter).sort({ name: 1 });
  }

  async findById(teamId: string): Promise<Team | null> {
    try {
      return await this.teamModel.findById(teamId).exec();
    } catch (error) {
      console.error('Error finding team by ID:', error);
      throw error;
    }
  }

  async findByName(name: string) {
    if (!name) return null;
    return this.teamModel.findOne({ name });
  }

  async findOne(filter: FilterQuery<Team>) {
    return this.teamModel.findOne(filter);
  }

  async find(filter: FilterQuery<Team>, offset?: number, limit?: number) {
    const query = this.teamModel.find(filter);

    if (typeof offset === 'number' && offset > 0) {
      query.skip(offset);
    }

    if (typeof limit === 'number' && limit > 0) {
      query.limit(limit);
    }

    return query.exec();
  }

  async create(team: Team) {
    const lastTeam = await this.teamModel.findOne({}, {}, { sort: { _id: -1 } });
    const lastTeamNum: number = lastTeam?.num || 1;

    return this.teamModel.create({
      ...team,
      active: true,
      num: lastTeamNum + 1,
    });
  }

  async insertMany(teams: Team[]) {
    return this.teamModel.insertMany(teams);
  }

  async update(team: UpdateQuery<Team>, filter: FilterQuery<Team>) {
    const teamObj = { ...team };
    return this.teamModel.findOneAndUpdate(filter, teamObj, { upsert: true, new: true });
  }

  async updateMany(filter: FilterQuery<Team>, updateObj: UpdateQuery<Team>) {
    return this.teamModel.updateMany(filter, updateObj);
  }
  async updateOne(filter: FilterQuery<Team>, updateObj: UpdateQuery<Team>) {
    const updateTeam = await this.teamModel.updateOne(filter, updateObj);
    return updateTeam;
  }

  async delete(filter: FilterQuery<Team>) {
    return this.teamModel.deleteMany(filter);
  }

  async countDocuments(filter: FilterQuery<Team>) {
    return this.teamModel.countDocuments();
  }
}
