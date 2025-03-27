/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
import React from 'react';
import { IUserContext, UserRole } from './user';

export interface IMenuItem {
  id: number;
  imgName: string;
  text: string;
  link: string;
  role: UserRole[];
}

export enum EAssignStrategies {
  RANDOM = 'RANDOM',
  ANCHOR = 'ANCHOR',
  HIERARCHY = 'HIERARCHY',
}

export enum EMenuTitle {
  FWANGO = 'FWANGO',
  EDIT_MATCH = 'EDIT MATCH',
  EDIT_ROSTER = 'EDIT ROSTER',
  DASHBOARD = 'DASHBOARD',
  FIND_MATCHES = 'FIND MATCHES',
}

export enum EDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface IColMenu {
  id: number;
  title: EMenuTitle;
  link?: string;
}

export enum EEnv {
  development = 'development',
  production = 'production',
}

// export interface ITextCommon {
//   lw?: string;
//   rw?: string;
//   vertical?: boolean;
//   extraCls?: string;
//   lblTxt?: string;
//   name: string;
//   required: boolean;
//   defaultValue?: string | null | undefined;
//   readOnly?: boolean;
//   handleInputChange: (e: React.SyntheticEvent) => void;
// }

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
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ISelectInputProps extends IInputCommon {
  optionList: IOption[];
  handleSelect: (e:  React.ChangeEvent<HTMLSelectElement>) => void;
}

export interface ITextInputProps {
  name: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  lblTxt?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | null | undefined;
}

export interface IDateinputProps {
  lw?: string;
  rw?: string;
  vertical?: boolean;
  extraCls?: string;
  lblTxt?: string;
  name: string;
  required: boolean;
  defaultValue: Date;
  handleInputChange: (e: React.SyntheticEvent) => void;
  datetime?: boolean;
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
  setEmail: (state: string) => void;
  password: string;
  setPassword: (state: string) => void;
}

export interface IEventPageProps {
  params: {
    eventId: string;
  };
}

export enum EActionTexts {
  INITIALIZE = '',
}
