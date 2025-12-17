import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { Net } from 'src/net/net.schema';


@Injectable()
export class NetService {
  constructor(@InjectModel(Net.name) private netModel: Model<Net>) {}

  async create(net: Net): Promise<Net> {
    const savedNet = await this.netModel.create(net);
    return savedNet;
  }

  async createMany(nets: Net[]) {
    const newNets = await this.netModel.insertMany(nets);
    return newNets;
  }

  async updateOne(filter: QueryFilter<Net>, updateObj: UpdateQuery<Net>) {
    const updatedNets = await this.netModel.updateOne(filter, updateObj);
    return updatedNets;
  }

  async updateMany(filter: QueryFilter<Net>, updateObj: UpdateQuery<Net>) {
    // db.collection.updateMany(filter, update, options)
    const updatedNets = await this.netModel.updateMany(filter, updateObj);
    return updatedNets;
  }

  async find(
    filter: QueryFilter<Net>,
    limit?: number,
    offset?: number, // added for consistency & scalability
  ) {
    let query = this.netModel.find(filter); // ensures stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    return query.lean().exec();
  }

  async countDocuments(filter: QueryFilter<Net>) {
    return this.netModel.countDocuments(filter);
  }

  async findOne(filter: QueryFilter<Net>) {
    return this.netModel.findOne(filter);
  }

  async findById(id: string) {
    return this.netModel.findById(id);
  }

  async findNetsWithMatches(netIds: string[]) {
    return this.netModel.find({ _id: { $in: netIds } }).populate('match');
  }

  async deleteMany(filter: QueryFilter<Net>) {
    return this.netModel.deleteMany(filter);
  }
}
