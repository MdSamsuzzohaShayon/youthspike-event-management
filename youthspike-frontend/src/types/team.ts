/* eslint-disable import/no-cycle */
import { IDocument } from './document';
import { ILeague } from './league';
import { IPlayerUser } from './user';

export interface ITeam extends IDocument {
  name: string;
  active: boolean;
  coachId: string;
  leagueId: string;
  players?: IPlayerUser[];
}
