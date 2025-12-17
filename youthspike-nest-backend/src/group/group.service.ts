import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
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

  // async find(filter: QueryFilter<Group>) {
  //   return this.groupModal.find(filter);
  // }

  async find(filter: QueryFilter<Group>, limit?: number, offset?: number) {
    let query = this.groupModal.find(filter).sort({ date: -1 }); // always sort for stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    return query.lean().exec();
  }

  async create(event: Group): Promise<Group> {
    return this.groupModal.create({
      ...event,
      active: true,
    });
  }

  async updateOne(filter: QueryFilter<Group>, updateData: UpdateQuery<Group>) {
    const updateGroup = await this.groupModal.updateOne(filter, updateData);
    return updateGroup;
  }

  async updateMany(filter: QueryFilter<Group>, updateData: UpdateQuery<Group>) {
    const updateGroup = await this.groupModal.updateMany(filter, updateData);
    return updateGroup;
  }

  async deleteMany(filter: QueryFilter<Group>) {
    return this.groupModal.deleteMany(filter);
  }

  async deleteOne(filter: QueryFilter<Group>) {
    return this.groupModal.deleteOne(filter);
  }
}
