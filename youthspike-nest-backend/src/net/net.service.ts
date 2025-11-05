import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { Net } from 'src/net/net.schema';
import { ServerReceiverOnNet } from 'src/server-receiver-on-net/server-receiver-on-net.schema';

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

  async updateOne(filter: FilterQuery<Net>, updateObj: UpdateQuery<Net>) {
    const updatedNets = await this.netModel.updateOne(filter, updateObj);
    return updatedNets;
  }

  async updateMany(filter: FilterQuery<Net>, updateObj: UpdateQuery<Net>) {
    // db.collection.updateMany(filter, update, options)
    const updatedNets = await this.netModel.updateMany(filter, updateObj);
    return updatedNets;
  }

  async find(
    filter: FilterQuery<Net>,
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
    query = query.lean();
    return query.exec();
  }

  async countDocuments(filter: FilterQuery<Net>) {
    return this.netModel.countDocuments(filter);
  }

  async findOne(filter: FilterQuery<Net>) {
    return this.netModel.findOne(filter);
  }

  async findById(id: string) {
    return this.netModel.findById(id);
  }

  async findNetsWithMatches(netIds: string[]) {
    return this.netModel.find({ _id: { $in: netIds } }).populate('match');
  }

  async deleteMany(filter: FilterQuery<Net>) {
    return this.netModel.deleteMany(filter);
  }
}
