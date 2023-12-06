import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from './event.schema';
import { Types } from 'mongoose';

interface IDynamicEvent {
  players?: {
    $each: string[];
  };
  teams?: {
    $each: string[];
  };
  // Add other properties as needed
}



@Injectable()
export class EventService {
  constructor(@InjectModel(Event.name) private eventModel: Model<Event>) {}

  async query(query: any) {
    return this.eventModel.find(query).sort({
      updatedAt: -1,
    });
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.eventModel.findById(id);
  }

  async findByName(name: string) {
    if (!name) return null;
    return this.eventModel.findOne({ name });
  }

  async findOne(query: any) {
    return this.eventModel.findOne(query);
  }

  async create(event: Event): Promise<Event> {
    return this.eventModel.create({
      ...event,
      active: true,
    });
  }

  async update(updateData: Partial<Event>, id: string) {
    const updateObj: any = { ...updateData };
  
    if (updateData.players) {
      updateObj.$addToSet = updateObj.$addToSet || {};
      updateObj.$addToSet.players = { $each: updateData.players };
      delete updateObj.players;
    }
  
    if (updateData.teams) {
      updateObj.$addToSet = updateObj.$addToSet || {};
      updateObj.$addToSet.teams = { $each: updateData.teams };
      delete updateObj.teams;
    }

    if (updateData.matches) {
      updateObj.$addToSet = updateObj.$addToSet || {};
      updateObj.$addToSet.matches = { $each: updateData.matches };
      delete updateObj.matches;
    }
  
    const updatedEvent = await this.eventModel.findOneAndUpdate(
      {
        _id: id,
      },
      updateObj,
      { upsert: true, new: true },
    );
  
    return updatedEvent;
  }
}
