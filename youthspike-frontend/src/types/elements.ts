/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
import React from "react";
import { IUserContext, UserRole } from "./user";
import { useMutation } from "@apollo/client/react";
import { ApolloCache } from "@apollo/client";

export interface IMenuItem {
  id: number;
  imgName: string;
  text: string;
  link: string;
  role: UserRole[];
}

export enum EAssignStrategies {
  RANDOM = "RANDOM",
  ANCHOR = "ANCHOR",
  HIERARCHY = "HIERARCHY",
}

export enum EMenuTitle {
  FWANGO = "FWANGO",
  EDIT_MATCH = "EDIT MATCH",
  EDIT_ROSTER = "EDIT ROSTER",
  DASHBOARD = "DASHBOARD",
  FIND_MATCHES = "FIND MATCHES",
}

export enum EDirection {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

export interface IColMenu {
  id: number;
  title: EMenuTitle;
  link?: string;
}

export enum EEnv {
  development = "development",
  production = "production",
}

export interface IOption {
  id: number;
  value: string;
  text?: string;
}

interface IInputCommon {
  name: string;
  label?: string;
  required?: boolean;
  className?: string;
  defaultValue?: string | number;
  value?: string | number;
}

export interface InputFieldProps extends IInputCommon {
  type: string;
  handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ISelectInputProps extends IInputCommon {
  optionList: IOption[];
  handleSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  compact?: boolean;
}

export interface ITextInputProps {
  name: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  lblTxt?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | null | undefined;
}

export interface IDateInputProps {
  name: string;
  handleInputChange: (e: React.SyntheticEvent) => void;
  label?: string;
  className?: string;
  required?: boolean;
  defaultValue?: Date;
}

export interface IFileFileProps {
  lw?: string;
  rw?: string;
  vertical?: boolean;
  extraCls?: string;
  lblTxt?: string;
  name: string;
  defaultValue?: string | undefined | null;
  handleFileChange: (e: React.SyntheticEvent) => void;
}

export interface INumberInputProps {
  name: string;
  required: boolean;
  defaultValue?: number | null | undefined;
  handleInputChange: (e: React.SyntheticEvent) => void;
  lw?: string;
  rw?: string;
  vertical?: boolean;
  extraCls?: string;
  lblTxt?: string;
}

export interface IToggleInputProps {
  lw?: string;
  widthCls?: number;
  extraCls?: string;
  lblTxt?: string;
  name: string;
  value: boolean | null | undefined;
  handleValueChange: (e: React.SyntheticEvent, stateName: string) => void;
}

export interface IButtonProps {
  handleClickEvent: (e: React.SyntheticEvent) => void;
  bg?: string;
  text?: string;
}

export interface IMenuArrangeProps {
  eventId: null | string;
  closeMenuHandler: (e: React.SyntheticEvent) => void;
  renderMenuItems: (
    eventId: string,
    userMenuList: IMenuItem[]
  ) => React.ReactNode;
  userMenuList: IMenuItem[];
  user: IUserContext;
  handleLogout: (e: React.SyntheticEvent) => void;
}

export enum EMessage {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  SUCCESS = "SUCCESS",
}

export enum EView {
  ALL_NETS = "ALL_NETS",
  ROUND = "ROUND",
  NET = "NET",
}
export interface IMessage {
  name?: string;
  message?: string;
  type?: EMessage;
}

export type TMutation = useMutation.MutationFunction<
  unknown,
  {
    [x: string]: any;
  },
  ApolloCache
>;

export interface ILoginProps {
  handleLogin: (e: React.SyntheticEvent) => void;
  email: string;
  setEmail: (state: string) => void;
  password: string;
  setPassword: (state: string) => void;
}

export type TParams = Promise<Record<string, string>>;

export enum EActionTexts {
  INITIALIZE = "",
}

export enum ESRRole {
  SERVER = "SERVER",
  SWING = "SWING",
  RECEIVER = "RECEIVER",
  SETTER = "SETTER",
}

// Enums for better type safety
export enum ENDirection {
  PREV = "prev",
  NEXT = "next",
}

export enum EArrowSize {
  SM = "sm",
  MD = "md",
  LG = "lg",
}

export enum ELayout {
  MOBILE = "mobile",
  DESKTOP = "desktop",
  TABLET = "tablet",
}

export enum ETeamType {
  TEAM_A = "teamA",
  TEAM_B = "teamB",
}
