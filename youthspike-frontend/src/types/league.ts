import { IDocument } from './document';

export interface ILeague extends IDocument {
  name: string;
  startDate: Date;
  endDate: Date;
  active: boolean;
  playerLimit: number;
}
