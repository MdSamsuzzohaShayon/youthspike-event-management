import { Injectable } from '@nestjs/common';
import { LDO } from 'src/ldo/ldo.schema';
import { AppResponse } from '../shared/response';
import { FilterQuery, Model } from 'mongoose';
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
    const filter: FilterQuery<LDO> = {
      $or: [{ director: directorOrLdoId.toString() }, { _id: directorOrLdoId.toString() }],
    };

    // Execute the update query
    const result = await this.ldoModel.findOneAndUpdate(filter, updateObject, { upsert: true, new: true });

    return result;
  }

  async findByDirectorId(dId: string) {
    return this.ldoModel.findOne({
      $or: [{ director: dId.toString() }, { _id: dId.toString() }],
    });
  }

  async query(filter: FilterQuery<LDO>) {
    return this.ldoModel.find(filter);
  }
}
