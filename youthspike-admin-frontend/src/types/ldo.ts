import { IDirector, IEvent, IEventExpRel } from ".";
import { IDirectorItem } from "./user";

export interface ILDO {
  name: string;
  logo: string;
  director?: IDirector;
  events?: IEvent[]
}

export interface ILDOItem {
  _id: string;
  name: string;
  logo: string;
  director?: IDirectorItem;
}

export interface ILdoUpdate {
  name?: string;
  logo?: string;
  password?: string;
  confirmPassword?: string;
}

export interface ILDOExpRel{
  name: string;
  logo: string;
  director?: IDirector;
  events?: IEventExpRel[],
}