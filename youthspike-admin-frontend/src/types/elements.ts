/* eslint-disable import/no-cycle */
/* eslint-disable no-unused-vars */
import React from 'react';
import { IPlayer } from './player';
import { IUserContext } from './user';
import { ITeam } from './team';
import { useMutation } from '@apollo/client/react';
import { ApolloCache } from '@apollo/client';

export enum EAssignStrategies {
  RANDOM = 'RANDOM',
  AUTO = 'AUTO',
  ANCHORING = 'ANCHORING',
}

export enum EEnv {
  development = 'development',
  production = 'production',
}

export interface IMenuItem {
  id: number;
  imgName: string;
  text: string;
  link: string;
}

export interface ITextCommon {
  name: string;
  label?: string;
  className?: string;
  required?: boolean;
  value?: string | number;
  readOnly?: boolean;
}

export interface InputFieldProps extends ITextCommon {
  type: string;
  tooltip?: string;
  defaultValue?: string | number;
  handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export interface DivisionInputProps extends ITextCommon {
  defaultValue?: string;
}

export interface ITextInputProps extends ITextCommon {
  defaultValue?: string;
  handleInputChange?: (e: React.SyntheticEvent) => void;
}
export interface IPasswordInputProps extends ITextInputProps {
  svgColor?: string;
}

export interface ITextareaInputProps extends ITextCommon {
  defaultValue?: string;
  handleInputChange?: (e: React.SyntheticEvent) => void;
}

export interface IPlayerSelectProps {
  name: string;
  extraCls?: string;
  defaultValue?: string[];
  handleCheckboxChange: (pId: string, isChecked: boolean) => void;
  availablePlayers: IPlayer[];
  eventId: string;
}

export interface ITeamSelectProps {
  name: string;
  extraCls?: string;
  defaultValue?: string[];
  handleCheckboxChange: (pId: string, isChecked: boolean) => void;
  teamList: ITeam[];
  eventId: string;
}

export interface IDateChangeHandlerProps {
  name: string;
  value: string;
}

export interface IDateinputProps extends ITextCommon {
  defaultValue?: string;
  handleDateChange?: (name: string, value: string) => void;
}

export interface IFileFileProps {
  name: string;
  label?: string | null;
  defaultValue?: string | undefined | null;
  handleFileChange: (e: React.SyntheticEvent) => void;
}

export interface IImageFileProps extends ITextCommon {
  defaultValue?: string | null;
  handleFileChange?: (uploadedFile: Blob | MediaSource) => void;
}

export interface IAnyFileFileProps {
  name: string;
  handleFileChange: (e: React.SyntheticEvent) => void;
  lw?: string;
  rw?: string;
  vertical?: boolean;
  extraCls?: string;
  lblTxt?: string;
}

export interface INumberInputProps {
  name: string;
  required?: boolean;
  defaultValue?: number | string | null | undefined;
  handleInputChange: (e: React.SyntheticEvent) => void;
  lw?: string;
  rw?: string;
  vertical?: boolean;
  extraCls?: string;
  lblTxt?: string;
}

// @ts-ignore
export interface IToggleInputProps extends ITextCommon {
  value?: boolean;
  defaultValue?: boolean;
  handleInputChange: (e: React.SyntheticEvent) => void;
  negative?: string;
  positive?: string;
}

export interface ICheckboxInputProps {
  name: string;
  _id: string;
  handleInputChange: (e: React.SyntheticEvent, _id: string) => void;
  defaultValue?: boolean;
  className?: string;
}

export interface IOption {
  id: number;
  value: string;
  text?: string;
}
/*
export interface ITextCommon {
  name: string;
  label?: string;
  className?: string;
  required?: boolean;
  value?: string | number;
  readOnly?: boolean;
  
}
*/

export interface IPlayerPage {
  eventId: string;
  date: string;
  page: number;
}

export interface ISelectInputProps extends ITextCommon {
  optionList: IOption[];
  defaultValue?: string | number | null;
  compact?: boolean;
  handleSelect?: (e: React.SyntheticEvent) => void;
}

export interface IButtonProps {
  handleClickEvent: (e: React.SyntheticEvent) => void;
  bg?: string;
  text?: string;
}

export interface IMenuArrangeProps {
  eventId: null | string;
  closeMenuHandler: (e: React.SyntheticEvent) => void;
  renderMenuItems: (eventId: string, userMenuList: IMenuItem[]) => React.ReactNode;
  userMenuList: IMenuItem[];
  user: IUserContext;
  handleLogout: (e: React.SyntheticEvent) => void;
}

export interface IError {
  message?: string;
  success?: boolean;
  code?: number;
}

export interface IResponse {
  success: boolean;
  code: number;
  message: string;
}

export interface ILoginProps {
  handleLogin: (e: React.SyntheticEvent) => void;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  passcode: string;
  setPasscode: React.Dispatch<React.SetStateAction<string>>;
}

export interface ICheckedInput {
  _id: string;
  checked: boolean;
}

export enum EFilterPage{
  MATCHES = "matches",
  TEAMS = "teams",
  PLAYERS = "players",
}

export type TMutationFunction = useMutation.MutationFunction<
  unknown,
  {
    [x: string]: any;
  },
  ApolloCache
>;
// export type TParams = { [key: string]: string | string[] | undefined };
export type TParams = Promise<Record<string, string>>;
