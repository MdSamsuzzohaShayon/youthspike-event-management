import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { Types } from 'mongoose';
import { Group } from './group.schema';

@Injectable()
export class GroupService {
  constructor(@InjectModel(Group.name) private groupModal: Model<Group>) {}

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.groupModal.findById(id);
  }

  async findOne(query: any) {
    return this.groupModal.findOne(query);
  }

  async find(filter: FilterQuery<Group>) {
    return this.groupModal.find(filter);
  }

  async create(event: Group): Promise<Group> {
    return this.groupModal.create({
      ...event,
      active: true,
    });
  }

  async updateOne(filter: FilterQuery<Group>, updateData: UpdateQuery<Group>) {
    const updateGroup = await this.groupModal.updateOne(filter, updateData);
    return updateGroup;
  }

  async updateMany(filter: FilterQuery<Group>, updateData: UpdateQuery<Group>) {
    const updateGroup = await this.groupModal.updateMany(filter, updateData);
    return updateGroup;
  }

  async deleteMany(filter: FilterQuery<Group>) {
    return this.groupModal.deleteMany(filter);
  }

  async deleteOne(filter: FilterQuery<Group>) {
    return this.groupModal.deleteOne(filter);
  }
}
