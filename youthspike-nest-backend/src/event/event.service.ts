import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { Event } from './event.schema';
import { Types } from 'mongoose';


@Injectable()
export class EventService {
  constructor(@InjectModel(Event.name) private eventModel: Model<Event>) {}


  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.eventModel.findById(id).lean();
  }

  async findByName(name: string) {
    if (!name) return null;
    return this.eventModel.findOne({ name });
  }

  async findOne(filter: QueryFilter<Event>) {
    return this.eventModel.findOne(filter).lean();
  }

  async find(filter: QueryFilter<Event>) {
    return this.eventModel.find(filter);
  }

  async create(event: Event): Promise<Event> {
    return this.eventModel.create({
      ...event,
      active: true,
    });
  }

  async updateOne(filter: QueryFilter<Event>, updateData: UpdateQuery<Event>){
    const updateEvent = await this.eventModel.updateOne(filter, updateData);
    return updateEvent;
  }

  async delete(filter: QueryFilter<Event>) {
    return this.eventModel.deleteMany(filter);
  }
}
