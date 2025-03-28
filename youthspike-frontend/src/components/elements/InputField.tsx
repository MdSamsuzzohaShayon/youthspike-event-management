/* eslint-disable react/jsx-props-no-spreading */
import { InputFieldProps } from '@/types';
import React from 'react';

function InputField({ name, type = 'text', label, value, defaultValue, handleInputChange, className = '', required = false }: InputFieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={name} className="capitalize text-lg font-semibold mb-1">
        {label || name}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        {...(defaultValue && { defaultValue })}
        {...(value && { value })}
        onChange={handleInputChange}
        required={required}
        className="w-full p-3 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
    </div>
  );
};

export default InputField;
