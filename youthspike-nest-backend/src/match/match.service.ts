import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { sign } from 'crypto';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { Match } from 'src/match/match.schema';
import { AppResponse } from 'src/shared/response';
import { UserService } from 'src/user/user.service';
import { TeamService } from 'src/team/team.service';
import { RoundService } from 'src/round/round.service';

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<Match>,
    private teamService: TeamService,
    private userService: UserService,
    private jwtService: JwtService,
    private roundService: RoundService,
  ) {}

  async query(filter: QueryFilter<Match>) {
    return this.matchModel.find(filter).sort({
      updatedAt: -1,
    });
  }

  async find(filter: QueryFilter<Match>, limit?: number, offset?: number) {
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
    return this.matchModel.findById(id);
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
}
