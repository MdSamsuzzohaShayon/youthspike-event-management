import { ITextInputProps } from '@/types';
import React from 'react';

function TextInput({ defaultValue, name, handleInputChange, required, lblTxt, placeholder }: ITextInputProps) {
  let dv = '';
  if (defaultValue && defaultValue !== '') dv = defaultValue;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="capitalize text-sm font-medium text-gray-300">
        {lblTxt || name}
      </label>
      <input
        onChange={handleInputChange}
        id={name}
        name={name}
        placeholder={placeholder}
        className="w-full p-3 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        type="text"
        defaultValue={dv}
        required={required}
      />
    </div>
  );
}

export default TextInput;
