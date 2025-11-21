/* eslint-disable react/jsx-props-no-spreading */
import { InputFieldProps } from '@/types';
import React from 'react';

function InputField({ 
  name, 
  type = 'text', 
  label, 
  value, 
  defaultValue, 
  handleInputChange, 
  className = '', 
  required = false,
  compact = false 
}: InputFieldProps & { compact?: boolean }) {
  if (compact) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <label htmlFor={name} className="text-xs font-medium text-gray-300 uppercase">
          {label || name}
        </label>
        <input
          id={name}
          name={name}
          type={type}
          {...(defaultValue && { defaultValue })}
          {...(value && { value })}
          {...(handleInputChange && { onChange: handleInputChange })}
          required={required}
          className="text-sm p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={name} className="text-sm font-medium text-gray-300 mb-1 uppercase">
        {label || name}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        {...(defaultValue && { defaultValue })}
        {...(value && { value })}
        {...(handleInputChange && { onChange: handleInputChange })}
        required={required}
        className="p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white text-sm"
      />
    </div>
  );
};

export default InputField;