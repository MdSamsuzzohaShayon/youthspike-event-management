// src/team/interfaces/counter.interface.ts

import { Document } from 'mongoose';

export interface Counter extends Document {
  field: string;
  sequence: number;
}