import React from "react";
import { IUserContext } from ".";

export interface IMenuItem {
  id: number;
  imgName: string;
  text: string;
  link: string;
}

export interface ITextInputProps {
  lw?: string;
  rw?: string;
  vertical?: boolean;
  extraCls?: string;
  lblTxt?: string;
  name: string;
  required: boolean;
  defaultValue: string | number;
  handleInputChange: (e: React.SyntheticEvent) => void;
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
  defaultValue: string | number;
  handleFileChange: (e: React.SyntheticEvent) => void;
}

export interface INumberInputProps {
  name: string;
  required: boolean;
  defaultValue: number | null;
  handleInputChange: (e: React.SyntheticEvent) => void;
  lw?: string;
  rw?: string;
  vertical?: boolean;
  extraCls?: string;
  lblTxt?: string;
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

export interface IMenuArrangeProps{
  eventId: null | string;
  closeMenuHandler: (e: React.SyntheticEvent) => void;
  renderMenuItems: (eventId: string, userMenuList: IMenuItem[]) => React.ReactNode;
  userMenuList: IMenuItem[];
  user: IUserContext;
  handleLogout: (e: React.SyntheticEvent) => void;
}

export interface IError {
  message?: string;
  name?: string;
  main?: any
}


export interface ILoginProps {
  handleLogin: (e: React.SyntheticEvent) => void;
  email: string;
  setEmail: (state: string) => void;
  password: string;
  setPassword: (state: string) => void;
}
