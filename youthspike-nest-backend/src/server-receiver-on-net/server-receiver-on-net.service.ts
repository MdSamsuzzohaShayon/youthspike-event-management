import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ServerReceiverOnNet, ServerReceiverSinglePlay } from './server-receiver-on-net.schema';
import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';

type ServerReceiverSinglePlayDocument = ServerReceiverSinglePlay & Document;

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

  async find(
    filter: FilterQuery<ServerReceiverOnNet>,
    limit?: number,
    offset?: number, // added for consistency & scalability
  ) {
    let query = this.serverReceiverOnNetModel.find(filter); // ensures stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }
    query = query.lean()
    return query.exec();
  }

  async findOne(filter: FilterQuery<ServerReceiverOnNet>): Promise<ServerReceiverOnNet> {
    return this.serverReceiverOnNetModel.findOne(filter);
  }

  async findById(id: string): Promise<ServerReceiverOnNet> {
    return this.serverReceiverOnNetModel.findById(id);
  }

  async deleteMany(filter: FilterQuery<ServerReceiverOnNet>) {
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

  async findSinglePlay(
    filter: FilterQuery<ServerReceiverSinglePlay>,
    limit?: number,
    offset?: number, // added for consistency & scalability
  ) {
    let query = this.serverReceiverOnNetSinglePlayModel.find(filter); // ensures stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }
    query = query.lean()
    return query.exec();
  }

  async findOneSinglePlay(filter: FilterQuery<ServerReceiverSinglePlay>): Promise<ServerReceiverSinglePlay> {
    return this.serverReceiverOnNetSinglePlayModel.findOne(filter);
  }

  async findByIdSinglePlay(id: string): Promise<ServerReceiverSinglePlay> {
    return this.serverReceiverOnNetSinglePlayModel.findById(id);
  }

  async deleteManySinglePlay(filter: FilterQuery<ServerReceiverSinglePlay>) {
    return this.serverReceiverOnNetSinglePlayModel.deleteMany(filter);
  }
  async deleteOneSinglePlay(filter: FilterQuery<ServerReceiverSinglePlay>) {
    return this.serverReceiverOnNetSinglePlayModel.deleteOne(filter);
  }
}
