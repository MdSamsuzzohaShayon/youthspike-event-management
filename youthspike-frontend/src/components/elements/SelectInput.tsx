/* eslint-disable react/require-default-props */
import { IOption } from '@/types';
import React, { useState } from 'react';

interface ISelectInputProps {
  name: string;
  optionList: IOption[];
  // eslint-disable-next-line no-unused-vars
  handleSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  defaultValue?: string | number;
  vertical?: boolean;
  lw?: string;
  rw?: string;
  extraCls?: string;
  lblTxt?: string;
}

function SelectInput({ lw = '', rw = 'form-control', extraCls = '', lblTxt, name, vertical = false, optionList, defaultValue, handleSelect }: ISelectInputProps) {
  const selectStyle: React.CSSProperties = !rw ? { width: '19%' } : {};

  // eslint-disable-next-line no-unused-vars
  const [defaultSelected, setDefaultSelected] = useState<string>(() => {
    return optionList.length > 0 ? optionList[0].value : '';
  });

  return (
    <div className={`input-group mt-4 w-full flex ${vertical ? 'flex-col' : 'flex-row'} justify-between items-center ${extraCls}`}>
      <label htmlFor={name} className={`capitalize ${vertical ? 'w-full' : ''} ${lw}`}>
        {lblTxt || name}
      </label>
      <select
        onChange={handleSelect}
        name={name}
        id={name}
        defaultValue={defaultValue || defaultSelected}
        className={`form-control capitalize ${vertical ? 'w-full' : ''} ${rw} max-w-full`}
        style={vertical ? {} : selectStyle}
      >
        <option value="">Select an option</option>
        {optionList.map((o) => (
          <option value={o.value} key={o.value} className="bg-gray-500 text-black-logo">
            {o.text || o.value}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectInput;
