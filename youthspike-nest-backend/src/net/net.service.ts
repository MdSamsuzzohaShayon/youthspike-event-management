import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Net } from 'src/net/net.schema';

@Injectable()
export class NetService {
  constructor(@InjectModel(Net.name) private netModel: Model<Net>) {}

  async create(net: Net) {
    return this.netModel.create({
      ...net,
    });
  }

  async createMany(nets: Net[]) {
    const newNets = await this.netModel.insertMany(nets);
    return newNets;
  }

  async update(net: Partial<Net>, id: string) {
    return this.netModel.findOneAndUpdate(
      {
        _id: id,
      },
      net,
      { upsert: true, new: true },
    );
  }

  async query(filter: FilterQuery<Net>) {
    return this.netModel.find(filter).sort({
      num: 1,
    });
  }

  async countDocuments(filter: FilterQuery<Net>) {
    return this.netModel.countDocuments(filter);
  }

  async findById(id: string) {
    return this.netModel.findById(id);
  }
}
