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
    const inputValue = e.target.value;

    // ✅ 1. Handle empty value
    if (!inputValue) {
      console.warn(`Input valie is not valid ${inputValue}`);
      return;
    }

    try {
      // ✅ 2. Create date safely (local date)
      const date = new Date(inputValue);

      // ✅ 3. Validate date
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date input: ${inputValue}`);
        return;
      }

      // ✅ 4. Convert safely
      handleDateChange?.(name, date.toISOString());

    } catch (error) {
      console.error('Date parsing error:', error);
    }
  };

  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    onChange: handleDateInputChange,
    id: name,
    name: name,
    type: 'date',
    required,
  };

  // ✅ Safe value handling
  const safeFormat = (val?: string) => {
    if (!val) return undefined;

    try {
      const formatted = defaultInputValue(val);
      return formatted || undefined;
    } catch {
      console.warn(`Invalid default/value for date: ${val}`);
      return undefined;
    }
  };

  if (value && value !== undefined) {
    inputProps.value = safeFormat(value as string);
  } else if (defaultValue !== undefined) {
    inputProps.defaultValue = safeFormat(defaultValue);
  }

  const inputClass = compact
    ? "text-sm p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white"
    : "p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white text-sm";

  const labelClass = compact
    ? "text-xs font-medium text-gray-300 uppercase"
    : "text-sm font-medium text-gray-300 mb-1 uppercase";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={name} className={labelClass}>
        {label || name}
      </label>
      <input {...inputProps} className={inputClass} />
    </div>
  );
};

export default DateInput;