import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Room } from './room.schema';
import { QueryFilter, Model } from 'mongoose';
import { CreateRoomInput, UpdateRoomInput } from './room.input';

@Injectable()
export class RoomService {
  constructor(@InjectModel(Room.name) private readonly roomModel: Model<Room>) {}

  async create(roomData: CreateRoomInput) {
    return this.roomModel.create(roomData);
  }

  async findOne(filter: QueryFilter<Room>) {
    return this.roomModel.findOne(filter);
  }

  async updateOne(filter: QueryFilter<Room>, roomData: UpdateRoomInput) {
    return this.roomModel.updateOne(filter, roomData);
  }

  async deleteOne(filter: QueryFilter<Room>) {
    return this.roomModel.deleteOne(filter);
  }
}
