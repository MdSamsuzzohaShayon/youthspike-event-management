import { ISelectInputProps } from '@/types';
import React from 'react';

function SelectInput({ 
  className, 
  name, 
  optionList, 
  label, 
  defaultValue, 
  value, 
  handleSelect,
  compact = false 
}: ISelectInputProps) {
  if (compact) {
    return (
      <div className={`flex flex-col gap-1 ${className || ''}`}>
        <label htmlFor={name} className="text-xs font-medium text-gray-300 uppercase">
          {label || name}
        </label>
        <select
          onChange={handleSelect}
          name={name}
          id={name}
          className="text-sm p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400"
          {...(defaultValue ? { defaultValue } : {})}
          {...(value ? { value } : {})}
        >
          <option value="" className="bg-gray-600 text-gray-300">
            All
          </option>
          {optionList.map((o, i) => (
            <option value={o.value} key={o.id + "_" + i} className="capitalize bg-gray-800 text-white">
              {o.text ? o.text : o.value}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className || ''}`}>
      <label htmlFor={name} className="text-sm font-medium text-gray-300 mb-1 uppercase">
        {label || name}
      </label>
      <select
        onChange={handleSelect}
        name={name}
        id={name}
        className="p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm"
        {...(defaultValue ? { defaultValue } : {})}
        {...(value ? { value } : {})}
      >
        <option value="" className="bg-gray-600 text-gray-300">
          {`Select ${label || name}`}
        </option>
        {optionList.map((o, i) => (
          <option value={o.value} key={o.id + "_" + i} className="capitalize bg-gray-800 text-white">
            {o.text ? o.text : o.value}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectInput;