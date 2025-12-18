import React, { useEffect, useState } from 'react';
import { IToggleInputProps } from '@/types';

function ToggleInput({
  name,
  label,
  value,
  defaultValue = false,
  handleInputChange,
  className = '',
  negative,
  positive
}: IToggleInputProps & { className?: string }) {
  const [isChecked, setIsChecked] = useState<boolean>(defaultValue);

  // Sync external value/defaultValue
  useEffect(() => {
    if (value !== undefined) {
      setIsChecked(value);
    } else {
      setIsChecked(defaultValue);
    }
  }, [value, defaultValue]);

  const handleToggle = (e: React.SyntheticEvent) => {
    const newValue = !isChecked;
    setIsChecked(newValue);

    // Emit event compatible with input fields
    if (handleInputChange) {
      handleInputChange(e);
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={name}
        className="text-sm font-medium text-gray-300 uppercase"
      >
        {label || name}
      </label>

      <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-md p-2">
        {/* ON / OFF text visible always */}
        <span className="text-sm font-semibold text-gray-300">{negative || "OFF"}</span>

        <button
          type="button"
          id={name}
          aria-pressed={isChecked}
          onClick={handleToggle}
          className={`
            relative w-12 h-6 rounded-full transition-colors 
            duration-300 flex items-center
            ${isChecked ? 'bg-yellow-logo' : 'bg-gray-700'}
          `}
        >
          <span
            className={`
              block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300
              ${isChecked ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>

        <span className="text-sm font-semibold text-gray-300">{positive || "ON"}</span>
      </div>

      {/* Real form input for forms */}
      <input
        type="checkbox"
        name={name}
        checked={isChecked}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}

export default ToggleInput;
