/* eslint-disable react/require-default-props */
import { IOption } from '@/types';
import React from 'react';

interface ISelectGeneralInputProps {
  name: string;
  optionList: IOption[];
  defaultTxt?: string;
  // eslint-disable-next-line no-unused-vars
  handleSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  defaultValue?: string | number;
  lblTxt?: string;
}

function SelectGeneralInput({ lblTxt, name, defaultTxt, optionList, defaultValue, handleSelect }: ISelectGeneralInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="capitalize text-sm font-medium text-gray-300">
        {lblTxt || name}
      </label>
      <select
        onChange={handleSelect}
        name={name}
        id={name}
        defaultValue={defaultValue}
        className="w-full p-3 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        <option value="" className="text-gray-400">
          {defaultTxt || 'Select an option'}
        </option>
        {optionList.map((o) => (
          <option value={o.value} key={o.value} className="text-gray-400">
            {o.text || o.value}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectGeneralInput;
