import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { Net, ServerReceiverOnNet } from 'src/net/net.schema';

@Injectable()
export class NetService {
  constructor(@InjectModel(Net.name) private netModel: Model<Net>) { }

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

  async updateMany(filter: FilterQuery<Net>, updateObj: UpdateQuery<Net>){
    // db.collection.updateMany(filter, update, options)
    const updatedNets = await this.netModel.updateMany(filter, updateObj);
    return updatedNets;
  }

  async find(filter: FilterQuery<Net>) {
    return this.netModel.find(filter);
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

  async findNetsWithMatches(netIds: string[]){
    return this.netModel.find({_id: {$in: netIds}}).populate('match');
  }


  async delete(filter: FilterQuery<Net>) {
    return this.netModel.deleteMany(filter);
  }
}


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
