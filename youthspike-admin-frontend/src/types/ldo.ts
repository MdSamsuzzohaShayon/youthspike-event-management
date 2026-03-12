import { IDirector, IEvent, IEventExpRel, IResponse } from '.';
import { IDocument } from './document';
import { IDirectorItem } from './user';

export interface ILDO extends IDocument{
  name: string;
  logo?: string | null;
  phone?: string;
  director?: IDirector;
  events?: IEvent[];
}

export interface IAddLDO{
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

export interface ILDOExpRel extends IDocument{
  name: string;
  logo: string;
  director?: IDirector;
  events?: IEventExpRel[];
}


export interface IGetEventDirectorQuery extends IResponse {
  data?: ILDO;
}

export interface IGetEventDirectorsQuery{
  data?: ILDO[];
}

export interface IGetLdoResponse extends IResponse{
  data: ILDO;
}
