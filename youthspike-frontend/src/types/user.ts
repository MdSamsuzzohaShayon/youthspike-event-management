import { IDocument } from "./document";

/**
 * User Roles
 */
export enum UserRole {
  "admin" = "admin",
  "captain" = "captain",
  "co_captain" = "co_captain",
  "director" = "director",
  "player" = "player",
  "public" = "public",
}

export interface ILogin{
  email: string;
  password: string;
}

/**
 * User
 */
export interface IUser extends IDocument {
  firstName: string;
  lastName: string;
  role: UserRole;
  team?: string;
  active: boolean;
  login: ILogin;
  captainplayer: string | null;
  cocaptainplayer: string | null;
}

/**
 * Add director user
 */
export interface IDirector{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface IDirectorItem{
  firstName: string;
  lastName: string;
  email: string;
  login: {email: string}
}



export interface IUserContext {
  token: string | null;
  info: IUser | null;
}