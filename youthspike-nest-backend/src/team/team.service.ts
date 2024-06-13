import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { Team } from 'src/team/team.schema';
import { Types } from 'mongoose';

type CreateQuery = Omit<Team, keyof Document>;

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

  async find(filter: FilterQuery<Team>) {
    return this.teamModel.find(filter);
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

  async updateMany(filter: FilterQuery<Team>, updateObj: UpdateQuery<Team>){
    return this.teamModel.updateMany(filter, updateObj);
  }
  async updateOne(filter: FilterQuery<Team>, updateObj: UpdateQuery<Team>){
    const updateTeam = await this.teamModel.updateOne(filter, updateObj);
    return updateTeam;
  }

  async delete(filter: FilterQuery<Team>) {
    return this.teamModel.deleteMany(filter);
  }
}
