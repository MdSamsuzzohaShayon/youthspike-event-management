import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Badge } from './badge.schema';
import { Model, QueryFilter, UpdateQuery } from 'mongoose';


// ── Service ───────────────────────────────────────────────────

@Injectable()
export class BadgeService {


  constructor(@InjectModel(Badge.name) private badgeModel: Model<Badge>, private configService: ConfigService) {

  }



  // ── Email sender ────────────────────────────────

  async findById(teamId: string): Promise<Badge | null> {
    return this.badgeModel.findById(teamId).lean();
  }

  async findByName(name: string) {
    if (!name) return null;
    return this.badgeModel.findOne({ name });
  }

  async findOne(filter: QueryFilter<Badge>) {
    return this.badgeModel.findOne(filter).lean();
  }





  async find(filter: QueryFilter<Badge>, offset?: number, limit?: number) {
    let query = this.badgeModel.find(filter).sort({ name: -1 }); // always sort for stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    return query.lean().exec();
  }

  async create(team: Badge) {

    return this.badgeModel.create(team);
  }

  async insertMany(teams: Badge[]) {
    return this.badgeModel.insertMany(teams);
  }


  async updateMany(filter: QueryFilter<Badge>, badge: UpdateQuery<Badge>) {
    return this.badgeModel.updateMany(filter, badge).lean();
  }
  async updateOne(filter: QueryFilter<Badge>, badge: UpdateQuery<Badge>) {
    const updateTeam = await this.badgeModel.updateOne(filter, badge);
    return updateTeam;
  }

  async delete(filter: QueryFilter<Badge>) {
    return this.badgeModel.deleteMany(filter);
  }

  async deleteOne(filter: QueryFilter<Badge>) {
    return this.badgeModel.deleteOne(filter);
  }

  async deleteMany(filter: QueryFilter<Badge>) {
    return this.badgeModel.deleteMany(filter);
  }

  async countDocuments() {
    return this.badgeModel.countDocuments();
  }
}