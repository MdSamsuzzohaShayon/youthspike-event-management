import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Room } from './room.schema';
import { FilterQuery, Model } from 'mongoose';
import { CreateRoomInput, UpdateRoomInput } from './room.input';

@Injectable()
export class RoomService {
    constructor(@InjectModel(Room.name) private readonly roomModel: Model<Room>) { }

    async create(roomData: CreateRoomInput) {
        return this.roomModel.create(roomData);
    }

    async findOne(filter: FilterQuery<Room>) {
        return this.roomModel.findOne(filter);
    }

    async query(filter: FilterQuery<Room>) {
        return this.roomModel.find(filter);
      }

    async update(filter: FilterQuery<Room>, roomData: UpdateRoomInput) {
        return this.roomModel.updateOne(filter, roomData);
    }
    async updateOne(filter: FilterQuery<Room>, roomData: UpdateRoomInput) {
        return this.roomModel.updateOne(filter, roomData);
    }

    async deleteOne(filter: FilterQuery<Room>) {
        return this.roomModel.deleteOne(filter);;
    }
}
