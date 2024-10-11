/* eslint-disable import/no-cycle */
/* eslint-disable no-unused-vars */
import React from 'react';
import { IPlayer } from './player';
import { IUserContext } from './user';

export enum EAssignStrategies {
  RANDOM = 'RANDOM',
  AUTO = 'AUTO',
  ANCHORING = 'ANCHORING',
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
  name: string;
  required?: boolean;
  defaultValue?: string | null | undefined;
  readOnly?: boolean;
  placeholder?: string;
  handleInputChange: (e: React.SyntheticEvent) => void;
}

export interface ITextInputProps extends ITextCommon { }

export interface ITextareaInputProps extends ITextCommon { }

export interface IPlayerSelectProps {
  name: string;
  ldoUrl: string;
  extraCls?: string;
  defaultValue?: string[];
  handleCheckboxChange: (pId: string, isChecked: boolean) => void;
  availablePlayers: IPlayer[];
  eventId: string;
}

export interface IDateinputProps {
  lw?: string;
  rw?: string;
  vertical?: boolean;
  extraCls?: string;
  lblTxt?: string;
  name: string;
  required: boolean;
  defaultValue: string;
  handleDateChange: ({ name, value }: { name: string, value: string }) => void;
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
  handleValueChange: (e: React.SyntheticEvent, stateName: string) => void;
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
  lblTxt?: string;
  name: string;
  vertical?: boolean;
  optionList: IOption[];
  defaultValue?: string | number;
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
  setEmail: (state: string) => void;
  password: string;
  setPassword: (state: string) => void;
}


export interface ICheckedInput{
  _id: string;
  checked: boolean;
}
