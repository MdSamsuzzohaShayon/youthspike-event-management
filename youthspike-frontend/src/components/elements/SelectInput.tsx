/* eslint-disable react/jsx-props-no-spreading */
import { ISelectInputProps } from '@/types';
import React from 'react';

function SelectInput({ className, name, optionList, label, defaultValue, value, handleSelect }: ISelectInputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className || ''}`}>
      <label htmlFor={name} className="capitalize text-lg font-semibold mb-1">
        {label || name}
      </label>

      <select
        onChange={handleSelect}
        name={name}
        id={name}
        className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        {...(defaultValue ? { defaultValue } : {})}
        {...(value ? { value } : {})}
      >
        <option value="" className="bg-gray-400 text-gray-700">
          {`Select ${label || name}`}
        </option>
        {optionList.map((o, i) => (
          <option value={o.value} key={o.id+ "_" + i} className="capitalize">
            {o.text ? o.text : o.value}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectInput;
