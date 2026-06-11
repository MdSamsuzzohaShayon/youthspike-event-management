/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import Image from 'next/image';

/**
 * Base props shared by input and textarea
 */
type BaseProps = {
  name: string;
  label?: string;
  className?: string;
  required?: boolean;
  compact?: boolean;
  onChange?: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
};

/**
 * Input-specific props
 */
type InputProps = BaseProps & {
  type?: React.HTMLInputTypeAttribute;
  value?: string;
  defaultValue?: string;
};

/**
 * Textarea-specific props
 */
type TextareaProps = BaseProps & {
  type: 'textarea';
  value?: string;
  defaultValue?: string;
  rows?: number;
};

/**
 * Final prop type
 */
type InputFieldProps = InputProps | TextareaProps;

function InputField(props: InputFieldProps) {
  const {
    name,
    label,
    className = '',
    required = false,
    compact = false,
    onChange,
  } = props;

  const isTextarea = props.type === 'textarea';
  const isPassword = !isTextarea && props.type === 'password';

  const [showPassword, setShowPassword] = useState(false);

  const baseWrapper = `flex flex-col gap-1 ${className}`;
  const labelClass = compact
    ? 'text-xs font-medium text-gray-300 uppercase'
    : 'text-sm font-medium text-gray-300 mb-1 uppercase';

  const inputBaseClass =
    'rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white text-sm';

  const inputType =
    isPassword ? (showPassword ? 'text' : 'password') : props.type ?? 'text';

  return (
    <div className={baseWrapper}>
      <label htmlFor={name} className={labelClass}>
        {label || name}
      </label>

      {isTextarea ? (
        <textarea
          id={name}
          name={name}
          rows={'rows' in props ? props.rows ?? 4 : 4}
          {...('defaultValue' in props && { defaultValue: props.defaultValue })}
          {...('value' in props && { value: props.value })}
          {...(onChange && { onChange })}
          required={required}
          className={`${inputBaseClass} p-3 resize-y min-h-[100px]`}
        />
      ) : (
        <div className="relative">
          <input
            id={name}
            name={name}
            type={inputType}
            {...('defaultValue' in props && {
              defaultValue: props.defaultValue,
            })}
            {...('value' in props && { value: props.value })}
            {...(onChange && { onChange })}
            required={required}
            className={`${inputBaseClass} p-2 pr-10 w-full`}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Image
                src={
                  showPassword
                    ? '/icons/eye-open.svg'
                    : '/icons/eye-close.svg'
                }
                alt="toggle password visibility"
                className='svg-white'
                width={18}
                height={18}
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default InputField;