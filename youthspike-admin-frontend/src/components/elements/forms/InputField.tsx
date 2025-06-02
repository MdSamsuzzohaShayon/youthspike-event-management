import { InputFieldProps } from '@/types/elements';
import React from 'react';



const InputField: React.FC<InputFieldProps> = ({
    name,
    type = 'text',
    label,
    value,
    defaultValue,
    handleInputChange,
    className = '',
    required = false,
    tooltip,
  }) => {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <label htmlFor={name} className="capitalize text-lg font-semibold mb-1">
          {label || name}
        </label>
  
        <div className="relative group">
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
  
          {tooltip && (
            <div className="absolute left-1/2 -top-10 -translate-x-1/2 bg-gray-700 text-white text-sm px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              {tooltip}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default InputField;
