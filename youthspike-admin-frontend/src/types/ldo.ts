import { IDirector, IEvent, IEventExpRel } from '.';
import { IDirectorItem } from './user';

export interface ILDO {
  name: string;
  logo: string;
  phone?: string;
  director?: IDirector;
  events?: IEvent[];
}

export interface ILDOItem {
  _id: string;
  name: string;
  logo: string;
  num: number;
  phone?: string;
  director?: IDirectorItem;
}

export interface ILdoUpdate {
  name?: string;
  logo?: string;
  password?: string;
  confirmPassword?: string;
}

export interface ILDOExpRel {
  name: string;
  logo: string;
  director?: IDirector;
  events?: IEventExpRel[];
}

export interface ICommonQuery {
  code: number;
  success: boolean;
  message: string;
}
export interface IGetEventDirectorQuery extends ICommonQuery {
  data: {
    events: IEvent[];
    director: IDirector;
  };
}
