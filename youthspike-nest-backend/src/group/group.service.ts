import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { Types } from 'mongoose';
import { Group, GroupPoints } from './group.schema';

@Injectable()
export class GroupService {
  constructor(@InjectModel(Group.name) private groupModal: Model<Group>, @InjectModel(GroupPoints.name) private groupPointsModal: Model<GroupPoints>,) {}

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.groupModal.findById(id);
  }

  async findOne(query: any) {
    return this.groupModal.findOne(query).lean();
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

  async insertMany(groups: Group[]) {
    return this.groupModal.insertMany(groups);
  }

  async deleteMany(filter: QueryFilter<Group>) {
    return this.groupModal.deleteMany(filter);
  }

  async deleteOne(filter: QueryFilter<Group>) {
    return this.groupModal.deleteOne(filter);
  }



  // Services for group match points
  async pointsFindById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.groupPointsModal.findById(id);
  }

  async pointsFindOne(query: any) {
    return this.groupPointsModal.findOne(query).lean();
  }


  async pointsFind(filter: QueryFilter<GroupPoints>, offset?: number, limit?: number) {
    let query = this.groupPointsModal.find(filter).sort({ date: -1 }); // always sort for stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    return query.lean().exec();
  }

  async pointsCreate(payload: Partial<GroupPoints>): Promise<GroupPoints> {
    const created = await this.groupPointsModal.create(payload);
    return created.toObject();
  }

  async pointsUpdateOne(filter: QueryFilter<Group>, updateData: UpdateQuery<Group>) {
    const updateGroup = await this.groupPointsModal.updateOne(filter, updateData);
    return updateGroup;
  }

  async pointsUpdateMany(filter: QueryFilter<Group>, updateData: UpdateQuery<Group>) {
    const updateGroup = await this.groupPointsModal.updateMany(filter, updateData);
    return updateGroup;
  }

  async pointsInsertMany(groups: Group[]) {
    return this.groupPointsModal.insertMany(groups);
  }

  async pointsDeleteMany(filter: QueryFilter<Group>) {
    return this.groupPointsModal.deleteMany(filter);
  }

  async pointsDeleteOne(filter: QueryFilter<Group>) {
    return this.groupPointsModal.deleteOne(filter);
  }
}
