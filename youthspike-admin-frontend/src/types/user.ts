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
}

export interface ILogin {
  email: string;
  password: string;
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



export interface IUserContext {
  token: string | null;
  info: IUser | null;
}