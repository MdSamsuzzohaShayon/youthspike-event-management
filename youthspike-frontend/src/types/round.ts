import { IDocument } from './document';
// import { INet } from './net';
// import { ISub } from './sub';

export interface IRound extends IDocument {
  // matchId: string;
  num: number;
  locked: boolean;
  // nets: INet[];
  // sub: ISub;
}
