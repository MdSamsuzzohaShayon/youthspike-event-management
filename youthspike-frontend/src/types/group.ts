import { IEvent, ITeam } from '.';
import { IDocument } from './document';

export interface IGroupAdd {
  name: string;
  event: string;
  active: boolean;
  division: string;
  teams: string[];
}

export interface IGroup extends IDocument {
  name: string;
  active: boolean;
  division: string;
}

export interface IGroupRelatives extends IGroup {
  teams: string[];
  event: string;
}

export interface IGroupExpRel extends IGroup {
  teams: ITeam[];
  event: IEvent;
}
