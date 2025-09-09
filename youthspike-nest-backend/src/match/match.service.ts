import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { sign } from 'crypto';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
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

  async query(filter: FilterQuery<Match>) {
    return this.matchModel.find(filter).sort({
      updatedAt: -1,
    });
  }
  
  async find(filter: FilterQuery<Match>) {
    return this.matchModel.find(filter).sort({
      updatedAt: -1,
    });
  }

  async findOne(filter: FilterQuery<Match>) {
    return this.matchModel.findOne(filter);
  }

  async findById(id: string) {
    return this.matchModel.findById(id);
  }

  async create(matchObj: Match): Promise<Match> {
    try {
      const match = await this.matchModel.create({
        ...matchObj,
        active: true,
      });
      return match;
    } catch (error) {
      console.log(error);
    }
    return null;
  }


  async updateMany(filter: FilterQuery<Match>, matchObj: UpdateQuery<Match>) {
    return this.matchModel.updateMany(filter, matchObj);
  }

  async updateOne(filter: FilterQuery<Match>, matchObj: UpdateQuery<Match>) {
    return this.matchModel.updateOne(filter, matchObj);
  }

  async deleteMany(filter: FilterQuery<Match>) {
    return this.matchModel.deleteMany(filter);
  }
}
