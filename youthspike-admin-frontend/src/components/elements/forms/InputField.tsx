import { InputFieldProps } from '@/types/elements';
import Image from 'next/image';
import React, { useState } from 'react';

const InputField: React.FC<InputFieldProps> = ({ name, type = 'text', label, value, defaultValue, handleInputChange, className = '', required = false, tooltip, placeholder }) => {
  const isPassword = type === 'password';
  const [visible, setVisible] = useState(false);

  /* pick the right input type every render */
  const inputType = isPassword ? (visible ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={name} className="uppercase text-lg font-semibold mb-1 text-gray-300">
        {label || name}
      </label>

      <div className="relative group">
        <input
          id={name}
          name={name}
          type={inputType}
          {...(defaultValue !== undefined && { defaultValue })}
          {...(value !== undefined && { value })}
          {...(placeholder && { placeholder })}
          onChange={handleInputChange}
          required={required}
          className="w-full p-3 pr-10 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-3 flex items-center focus:outline-none"
          >
            <Image
              src={visible ? '/icons/eye-open.svg' : '/icons/eye-close.svg'}
              alt={visible ? 'Hide password' : 'Show password'}
              width={20}
              height={20}
              className="w-5 h-5 svg-white hover:text-yellow-400 transition-colors"
            />
          </button>
        )}

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
