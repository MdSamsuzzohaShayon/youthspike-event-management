import React, { useEffect, useState } from 'react';
import { IToggleInputProps } from '@/types';

function ToggleInput({
  name,
  label,
  value,
  defaultValue = false,
  onChange,
  className = '',
  negative,
  positive
}: IToggleInputProps & { className?: string }) {
  const [isChecked, setIsChecked] = useState<boolean>(defaultValue);

  // Only sync when value prop actually changes (not on every render)
  useEffect(() => {
    // Only update if value is explicitly provided (not undefined)
    if (value !== undefined) {
      setIsChecked(value);
    }
  }, [value]); // Remove defaultValue from dependencies

  const handleToggle = (e: React.SyntheticEvent) => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    
    // Create a synthetic event-like object for the hidden checkbox
    if (onChange) {
      // If onChange expects a ChangeEvent, you might need to create one
      const fakeEvent = {
        target: {
          name: name,
          value: newValue,
          type: 'checkbox',
          checked: newValue
        }
      } as unknown as React.SyntheticEvent;
      onChange(fakeEvent);
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

      {/* Hidden checkbox for form submission */}
      <input
        type="checkbox"
        name={name}
        checked={isChecked}
        onChange={() => {}} // Empty onChange to avoid React warning
        className="hidden"
      />
    </div>
  );
}

export default ToggleInput;