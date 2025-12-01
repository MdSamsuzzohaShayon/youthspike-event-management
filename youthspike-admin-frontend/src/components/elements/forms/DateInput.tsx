import React from 'react';
import { IDateinputProps } from '@/types';
import { defaultInputValue } from '@/utils/datetime';

interface DateInputProps extends IDateinputProps {
  compact?: boolean;
}

const DateInput: React.FC<DateInputProps> = ({
  name,
  label,
  value,
  defaultValue,
  handleDateChange,
  className = '',
  required = false,
  compact = false
}) => {
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const inputEl = e.target;
    
    const now = new Date();
    const inputValue = new Date(`${inputEl.value}T${now.toISOString().split("T")[1]}`);
    
    if (handleDateChange) {
      handleDateChange(name, inputValue.toISOString());
    }
  };

  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    onChange: handleDateInputChange,
    id: name,
    name: name,
    type: 'date',
    required,
  };

  // Handle value and defaultValue with proper type checking
  if (value !== undefined) {
    const formattedValue = defaultInputValue(value as string);
    inputProps.value = formattedValue;
  } else if (defaultValue !== undefined) {
    const formattedDefaultValue = defaultInputValue(defaultValue);
    inputProps.defaultValue = formattedDefaultValue;
  }

  if (compact) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <label 
          htmlFor={name} 
          className="text-xs font-medium text-gray-300 uppercase"
        >
          {label || name}
        </label>
        <input
          {...inputProps}
          className="text-sm p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label 
        htmlFor={name} 
        className="text-sm font-medium text-gray-300 mb-1 uppercase"
      >
        {label || name}
      </label>
      <input
        {...inputProps}
        className="p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white text-sm"
      />
    </div>
  );
};

export default DateInput;