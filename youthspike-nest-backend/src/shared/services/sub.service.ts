import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sub } from 'src/sub/sub.schema';

@Injectable()
export class SubService {
  constructor(@InjectModel(Sub.name) private subModel: Model<Sub>) {}

  createOrUpdate(sub: Sub, id?: string) {
    if (!!id) {
      return this.subModel.findOneAndUpdate(
        {
          _id: id,
        },
        sub,
        { upsert: true, new: true },
      );
    }

    return this.subModel.create({
      ...sub,
    });
  }

  async query(query: any) {
    return this.subModel.find(query).sort({
      num: 1,
    });
  }

  async findOne(query: any) {
    return this.subModel.findOne(query);
  }

  async countDocuments(query: any) {
    return this.subModel.countDocuments(query);
  }

  async findById(id: string) {
    return this.subModel.findById(id);
  }
}
