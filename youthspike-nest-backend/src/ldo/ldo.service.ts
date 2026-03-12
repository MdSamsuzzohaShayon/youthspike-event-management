import { Injectable } from '@nestjs/common';
import { LDO } from 'src/ldo/ldo.schema';
import { AppResponse } from '../shared/response';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

interface LDOEvents extends LDO {
  $addToSet: { events: { $each: any } };
}

@Injectable()
export class LdoService {
  constructor(@InjectModel(LDO.name) private ldoModel: Model<LDO>) {}

  async create(ldo: LDO, userId: string, defaultName: string) {
    const newLdoObj = { ...ldo };

    const newName = ldo.name && ldo.name !== '' ? ldo.name : defaultName;
    newLdoObj.name = newName;

    return this.ldoModel.create({
      ...newLdoObj,
      name: newName,
      director: userId,
    });
  }

  async update(ldo: Partial<LDO>, directorOrLdoId: string) {
    const updateObject: Partial<LDOEvents> = { ...ldo }; // Use any for flexibility in adding dynamic properties

    // Add properties based on conditions
    if (ldo.events && ldo.events.length > 0) {
      // Use $addToSet to add events to the array if they don't exist
      updateObject.$addToSet = { events: { $each: ldo.events } };
      delete updateObject.events;
    }

    // Build the query based on the provided directorOrLdoId
    const filter: QueryFilter<LDO> = {
      $or: [{ director: directorOrLdoId.toString() }, { _id: directorOrLdoId.toString() }],
    };

    // Execute the update query
    const result = await this.ldoModel.findOneAndUpdate(filter, updateObject, { upsert: true, new: true });

    return result;
  }

  async updateOne(filter: QueryFilter<LDO>, updateObj: UpdateQuery<LDO>) {
    // Execute the update query
    const result = await this.ldoModel.updateOne(filter, updateObj);
    return result;
  }

  async updateMany(filter: QueryFilter<LDO>, updateObj: UpdateQuery<LDO>) {
    return this.ldoModel.updateMany(filter, updateObj);
  }

  async findByDirectorId(dId: string): Promise<LDO> {
    return this.ldoModel.findOne({
      $or: [{ director: dId.toString() }, { _id: dId.toString() }],
    }).lean();
  }

  async findOne(filter: QueryFilter<LDO>) {
    return this.ldoModel.findOne(filter).lean();
  }

  async find(filter: QueryFilter<LDO>) {
    return this.ldoModel.find(filter);
  }

  async query(filter: QueryFilter<LDO>) {
    return this.ldoModel.find(filter);
  }

  async delete(filter: QueryFilter<LDO>) {
    return this.ldoModel.deleteMany(filter);
  }
}
