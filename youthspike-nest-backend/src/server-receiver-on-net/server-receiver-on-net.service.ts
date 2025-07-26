import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ServerReceiverOnNet } from './server-receiver-on-net.schema';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';

@Injectable()
export class ServerReceiverOnNetService {
  constructor(@InjectModel(ServerReceiverOnNet.name) private serverReceiverOnNetModel: Model<ServerReceiverOnNet>) { }

  // Create
  async create(net: ServerReceiverOnNet): Promise<ServerReceiverOnNet> {
    const savedNet = await this.serverReceiverOnNetModel.create(net);
    return savedNet;
  }

  // Update
  async updateOne(filter: FilterQuery<ServerReceiverOnNet>, updateObj: UpdateQuery<ServerReceiverOnNet>) {
    const updatedNets = await this.serverReceiverOnNetModel.updateOne(filter, updateObj);
    return updatedNets;
  }

  async updateMany(filter: FilterQuery<ServerReceiverOnNet>, updateObj: UpdateQuery<ServerReceiverOnNet>){
    const updatedNets = await this.serverReceiverOnNetModel.updateMany(filter, updateObj);
    return updatedNets;
  }

  async find(filter: FilterQuery<ServerReceiverOnNet>): Promise<ServerReceiverOnNet[]> {
    return this.serverReceiverOnNetModel.find(filter);
  }

  async findOne(filter: FilterQuery<ServerReceiverOnNet>): Promise<ServerReceiverOnNet> {
    return this.serverReceiverOnNetModel.findOne(filter);
  }

  async findById(id: string): Promise<ServerReceiverOnNet> {
    return this.serverReceiverOnNetModel.findById(id);
  }

  async delete(filter: FilterQuery<ServerReceiverOnNet>) {
    return this.serverReceiverOnNetModel.deleteMany(filter);
  }
}
