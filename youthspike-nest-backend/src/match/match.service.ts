import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { sign } from 'crypto';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { Match, TeamMatchAbsence } from 'src/match/match.schema';
import { AppResponse } from 'src/shared/response';
import { UserService } from 'src/user/user.service';
import { TeamService } from 'src/team/team.service';
import { RoundService } from 'src/round/round.service';

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<Match>,
    @InjectModel(TeamMatchAbsence.name) private teamMatchAbsenseModel: Model<TeamMatchAbsence>,
  ) {}

  async query(filter: QueryFilter<Match>) {
    return this.matchModel.find(filter).sort({
      updatedAt: -1,
    });
  }

  async find(filter: QueryFilter<Match>, offset?: number, limit?: number) {
    let query = this.matchModel.find(filter).sort({ date: -1 }); // always sort for stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }


    return query.lean().exec();
  }

  async findOne(filter: QueryFilter<Match>) {
    return this.matchModel.findOne(filter);
  }

  async findById(id: string) {
    return this.matchModel.findById(id).lean();
  }

  async create(matchObj: Match): Promise<Match> {
    try {
      const match = await this.matchModel.create(matchObj);
      return match;
    } catch (error) {
      console.log(error);
    }
    return null;
  }

  async insertMany(matches: Match[]) {
    return this.matchModel.insertMany(matches);
  }
  
  async updateMany(filter: QueryFilter<Match>, matchObj: UpdateQuery<Match>) {
    return this.matchModel.updateMany(filter, matchObj);
  }

  async updateOne(filter: QueryFilter<Match>, matchObj: UpdateQuery<Match>) {
    return this.matchModel.updateOne(filter, matchObj);
  }

  async deleteMany(filter: QueryFilter<Match>) {
    return this.matchModel.deleteMany(filter);
  }

  async deleteOne(filter: QueryFilter<Match>) {
    return this.matchModel.deleteOne(filter);
  }


  // Team Match Absense
  async teamMatchAbsenseFind(filter: QueryFilter<TeamMatchAbsence>, offset?: number, limit?: number) {
    let query = this.teamMatchAbsenseModel.find(filter).sort({ date: -1 }); // always sort for stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }


    return query.lean().exec();
  }

  async teamMatchAbsenseFindOne(filter: QueryFilter<TeamMatchAbsence>) {
    return this.teamMatchAbsenseModel.findOne(filter);
  }

  async teamMatchAbsenseCountDocuments(filter: QueryFilter<TeamMatchAbsence>) {
    return this.teamMatchAbsenseModel.countDocuments(filter);
  }

  async teamMatchAbsensefindById(id: string) {
    return this.teamMatchAbsenseModel.findById(id).lean();
  }

  async teamMatchAbsenseCreate(matchObj: TeamMatchAbsence): Promise<TeamMatchAbsence> {
    try {
      const match = await this.teamMatchAbsenseModel.create(matchObj);
      return match;
    } catch (error) {
      console.log(error);
    }
    return null;
  }

  async teamMatchAbsenseInsertMany(matches: TeamMatchAbsence[]) {
    return this.teamMatchAbsenseModel.insertMany(matches);
  }
  
  async teamMatchAbsenseUpdateMany(filter: QueryFilter<TeamMatchAbsence>, matchObj: UpdateQuery<TeamMatchAbsence>) {
    return this.teamMatchAbsenseModel.updateMany(filter, matchObj);
  }

  async teamMatchAbsenseUpdateOne(filter: QueryFilter<TeamMatchAbsence>, matchObj: UpdateQuery<TeamMatchAbsence>) {
    return this.teamMatchAbsenseModel.updateOne(filter, matchObj);
  }

  async teamMatchAbsenseDeleteMany(filter: QueryFilter<TeamMatchAbsence>) {
    return this.teamMatchAbsenseModel.deleteMany(filter);
  }

  async teamMatchAbsenseDeleteOne(filter: QueryFilter<TeamMatchAbsence>) {
    return this.teamMatchAbsenseModel.deleteOne(filter);
  }
}
