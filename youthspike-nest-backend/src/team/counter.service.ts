// src/team/counter.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter } from './counter.interface';

@Injectable()
export class CounterService {
  constructor(@InjectModel('Counter') private readonly counterModel: Model<Counter>) {}

  async getNextSequence(fieldName: string): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { field: fieldName },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    return counter.sequence;
  }
}
