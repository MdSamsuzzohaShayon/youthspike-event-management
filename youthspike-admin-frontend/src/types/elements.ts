/* eslint-disable import/no-cycle */
/* eslint-disable no-unused-vars */
import React from 'react';
import { IPlayer } from './player';
import { IUserContext } from './user';
import { ITeam } from './team';

export enum EAssignStrategies {
  RANDOM = 'RANDOM',
  AUTO = 'AUTO',
  ANCHORING = 'ANCHORING',
}


export enum EEnv{
  development = "development",
  production = "production",
}


export interface IMenuItem {
  id: number;
  imgName: string;
  text: string;
  link: string;
}

export interface ITextCommon {
  lw?: string;
  rw?: string;
  vertical?: boolean;
  extraCls?: string;
  lblTxt?: string;
  tooltip?: string;
  name: string;
  required?: boolean;
  defaultValue?: string | null | undefined;
  readOnly?: boolean;
  placeholder?: string;
  handleInputChange: (e: React.SyntheticEvent) => void;
}

export interface ITextInputProps extends ITextCommon { }
export interface IPasswordInputProps extends ITextInputProps {
  svgColor?: string;
 }

export interface ITextareaInputProps extends ITextCommon { }

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

export interface IDateChangeHandlerProps{ 
  name: string; 
  value: string; 
}

export interface IDateinputProps {
  name: string;
  handleDateChange: ({ name, value }: IDateChangeHandlerProps) => void;
  lw?: string;
  rw?: string;
  vertical?: boolean;
  extraCls?: string;
  lblTxt?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
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

export interface IImageFileProps {
  lw?: string;
  rw?: string;
  vertical?: boolean;
  extraCls?: string;
  lblTxt?: string;
  name: string;
  defaultValue?: string | undefined | null;
  handleFileChange: (uploadedFile: Blob | MediaSource) => void;
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

export interface IToggleInputProps {
  lw?: string;
  widthCls?: number;
  extraCls?: string;
  lblTxt?: string;
  name: string;
  value: boolean | null | undefined;
  handleInputChange: (e: React.SyntheticEvent) => void;
}

export interface ICheckboxInputProps {
  name: string;
  _id: string;
  handleInputChange: (e: React.SyntheticEvent, _id: string) => void;
  defaultValue?: boolean;
  extraCls?: string;
}

export interface IOption {
  value: string;
  text?: string;
}

export interface ISelectInputProps {
  lw?: string;
  rw?: string;
  extraCls?: string;
  defaultTxt?:string;
  lblTxt?: string;
  name: string;
  vertical?: boolean;
  optionList: IOption[];
  defaultValue?: string | number | null;
  value?: string | number | null;
  handleSelect: (e: React.SyntheticEvent) => void;
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

export interface ILoginProps {
  handleLogin: (e: React.SyntheticEvent) => void;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  passcode: string;
  setPasscode: React.Dispatch<React.SetStateAction<string>>
}


export interface ICheckedInput{
  _id: string;
  checked: boolean;
}
