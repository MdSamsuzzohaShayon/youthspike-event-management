import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ServerReceiverOnNet, ServerReceiverSinglePlay } from './server-receiver-on-net.schema';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';

@Injectable()
export class ServerReceiverOnNetService {
  constructor(
    @InjectModel(ServerReceiverOnNet.name) private serverReceiverOnNetModel: Model<ServerReceiverOnNet>,
    @InjectModel(ServerReceiverSinglePlay.name) private serverReceiverOnNetSinglePlayModel: Model<ServerReceiverSinglePlay>,
  ) { }

  // Current
  async create(net: ServerReceiverOnNet): Promise<ServerReceiverOnNet> {
    const savedNet = await this.serverReceiverOnNetModel.create(net);
    return savedNet;
  }

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


  // Single Play
  async createSinglePlay(net: ServerReceiverSinglePlay): Promise<ServerReceiverSinglePlay> {
    const savedNet = await this.serverReceiverOnNetSinglePlayModel.create(net);
    return savedNet;
  }

  async updateOneSinglePlay(filter: FilterQuery<ServerReceiverSinglePlay>, updateObj: UpdateQuery<ServerReceiverSinglePlay>) {
    const updatedNets = await this.serverReceiverOnNetSinglePlayModel.updateOne(filter, updateObj);
    return updatedNets;
  }

  async updateManySinglePlay(filter: FilterQuery<ServerReceiverSinglePlay>, updateObj: UpdateQuery<ServerReceiverSinglePlay>){
    const updatedNets = await this.serverReceiverOnNetSinglePlayModel.updateMany(filter, updateObj);
    return updatedNets;
  }

  async findSinglePlay(filter: FilterQuery<ServerReceiverSinglePlay>): Promise<ServerReceiverSinglePlay[]> {
    return this.serverReceiverOnNetSinglePlayModel.find(filter);
  }

  async findOneSinglePlay(filter: FilterQuery<ServerReceiverSinglePlay>): Promise<ServerReceiverSinglePlay> {
    return this.serverReceiverOnNetSinglePlayModel.findOne(filter);
  }

  async findByIdSinglePlay(id: string): Promise<ServerReceiverSinglePlay> {
    return this.serverReceiverOnNetSinglePlayModel.findById(id);
  }

  async deleteSinglePlay(filter: FilterQuery<ServerReceiverSinglePlay>) {
    return this.serverReceiverOnNetSinglePlayModel.deleteMany(filter);
  }
}
