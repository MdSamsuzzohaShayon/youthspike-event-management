import React from 'react';
import { ITextInputProps } from '@/types';

const TextareaInput = (props: ITextInputProps) => {
  const dv = props.defaultValue || '';

  return (
    <div
      className="flex flex-col col-span-2"
    >
      <label
        htmlFor={props.name}
        className="capitalize text-lg font-semibold mb-1"
      >
        {props.label || props.name}
      </label>
      <textarea
        onChange={props.handleInputChange}
        id={props.name}
        name={props.name}
        className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        defaultValue={dv}
        required={props.required}
      />
    </div>
  );
};

export default TextareaInput;

