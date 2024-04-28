import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Sponsor } from './sponsor.schema';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { CreateSponsorInput } from './sponsor.input';

@Injectable()
export class SponsorService {
  constructor(@InjectModel(Sponsor.name) private readonly sponsorModel: Model<Sponsor>) {}

  async insertMany(createSponsors: CreateSponsorInput[]) {
    return this.sponsorModel.insertMany(createSponsors);
  }

  async updateMany(filter: FilterQuery<Sponsor>, updatedSponsor: UpdateQuery<Sponsor>) {
    return this.sponsorModel.updateMany(filter, updatedSponsor);
  }

  async query(filter: FilterQuery<Sponsor>) {
    return this.sponsorModel.find(filter);
  }

  async deleteMany(filter: FilterQuery<Sponsor>) {
    return this.sponsorModel.deleteMany(filter);
  }
}
