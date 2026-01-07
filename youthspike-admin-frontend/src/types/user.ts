import { IDocument } from "./document";
import { IResponse } from "./elements";

/**
 * User Roles
 */
export enum UserRole {
  "admin" = "admin",
  "captain" = "captain",
  "co_captain" = "co_captain",
  "director" = "director",
  "player" = "player",
}


/**
 * User
 */
export interface IUser extends IDocument {
  firstName: string;
  lastName: string;
  team?: string;
  teamLogo?: string;
  role: UserRole;
  active: boolean;
  passcode?: string | null;
  captainplayer?: string | null;
  cocaptainplayer?: string | null;
  player?: string | null;
}

/**
 * Add director user
 */
export interface IDirector {
  firstName: string;
  lastName: string;
  email: string;
  phone?:string;
  logo?: string;
}

export interface IAddDirector extends IDirector{
  password: string;
  confirmPassword: string;
  passcode: string;
}

export interface IDirectorItem {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  event: string | null;
  captainplayer: string | null;
}

interface IUserEvent extends IUser{
  event?: string;
}

export interface IUserContext {
  token: string | null;
  info: IUserEvent | null;
}

export interface ILoginResponse extends IResponse{
  data: IUserContext;
}