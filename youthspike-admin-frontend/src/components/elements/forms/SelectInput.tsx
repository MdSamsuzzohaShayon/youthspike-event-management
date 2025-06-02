import React from 'react';
import { ISelectInputProps } from '@/types';


const SelectInput = (props: ISelectInputProps) => {

  return (
    <div className={`flex flex-col ${props.className || ""}`}>
        <label htmlFor={props.name} className="capitalize text-lg font-semibold mb-1" >
          {props.label || props.name}
        </label>

      <select
        onChange={props.handleSelect}
        name={props.name}
        id={props.name}
        className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        {...(props.defaultValue ? { defaultValue: props.defaultValue } : {})}
        {...(props.value ? { value: props.value } : {})}
      >
        <option
          value=""
          className="bg-gray-400 text-gray-700"
        >
          {`Select ${props.name}`}
        </option>
        {props.optionList.map((o, i) => (
          <option
            value={o.value}
            key={i}
            className="capitalize"
          >
            {o.text ? o.text : o.value}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectInput;
