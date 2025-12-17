import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ServerReceiverOnNet, ServerReceiverSinglePlay } from './server-receiver-on-net.schema';
import { Document, QueryFilter, Model, UpdateQuery } from 'mongoose';

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

  async updateOne(filter: QueryFilter<ServerReceiverOnNet>, updateObj: UpdateQuery<ServerReceiverOnNet>) {
    const updatedNets = await this.serverReceiverOnNetModel.updateOne(filter, updateObj);
    return updatedNets;
  }

  async updateMany(filter: QueryFilter<ServerReceiverOnNet>, updateObj: UpdateQuery<ServerReceiverOnNet>){
    const updatedNets = await this.serverReceiverOnNetModel.updateMany(filter, updateObj);
    return updatedNets;
  }

  async find(
    filter: QueryFilter<ServerReceiverOnNet>,
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
    return query.lean().exec();
  }

  async findOne(filter: QueryFilter<ServerReceiverOnNet>): Promise<ServerReceiverOnNet> {
    return this.serverReceiverOnNetModel.findOne(filter);
  }

  async findById(id: string): Promise<ServerReceiverOnNet> {
    return this.serverReceiverOnNetModel.findById(id);
  }

  async deleteMany(filter: QueryFilter<ServerReceiverOnNet>) {
    return this.serverReceiverOnNetModel.deleteMany(filter);
  }


  // Single Play
  async createSinglePlay(net: ServerReceiverSinglePlay): Promise<ServerReceiverSinglePlay> {
    const savedNet = await this.serverReceiverOnNetSinglePlayModel.create(net);
    return savedNet;
  }

  async updateOneSinglePlay(filter: QueryFilter<ServerReceiverSinglePlay>, updateObj: UpdateQuery<ServerReceiverSinglePlay>) {
    const updatedNets = await this.serverReceiverOnNetSinglePlayModel.updateOne(filter, updateObj);
    return updatedNets;
  }

  async updateManySinglePlay(filter: QueryFilter<ServerReceiverSinglePlay>, updateObj: UpdateQuery<ServerReceiverSinglePlay>){
    const updatedNets = await this.serverReceiverOnNetSinglePlayModel.updateMany(filter, updateObj);
    return updatedNets;
  }

  async findSinglePlay(
    filter: QueryFilter<ServerReceiverSinglePlay>,
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
    return query.lean().exec();
  }

  async findOneSinglePlay(filter: QueryFilter<ServerReceiverSinglePlay>): Promise<ServerReceiverSinglePlay> {
    return this.serverReceiverOnNetSinglePlayModel.findOne(filter);
  }

  async findByIdSinglePlay(id: string): Promise<ServerReceiverSinglePlay> {
    return this.serverReceiverOnNetSinglePlayModel.findById(id);
  }

  async deleteManySinglePlay(filter: QueryFilter<ServerReceiverSinglePlay>) {
    return this.serverReceiverOnNetSinglePlayModel.deleteMany(filter);
  }
  async deleteOneSinglePlay(filter: QueryFilter<ServerReceiverSinglePlay>) {
    return this.serverReceiverOnNetSinglePlayModel.deleteOne(filter);
  }
}
