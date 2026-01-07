/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

/**
 * Base props shared by input and textarea
 */
type BaseProps = {
  name: string;
  label?: string;
  className?: string;
  required?: boolean;
  compact?: boolean;
  handleInputChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

/**
 * Input-specific props
 */
type InputProps = BaseProps & {
  type?: React.HTMLInputTypeAttribute; // ✅ TS native input types
  value?: string;
  defaultValue?: string;
};

/**
 * Textarea-specific props
 */
type TextareaProps = BaseProps & {
  type: 'textarea'; // ✅ discriminant
  value?: string;
  defaultValue?: string;
  rows?: number;
};

/**
 * Final prop type
 */
type InputFieldProps = InputProps | TextareaProps;

function InputField(props: InputFieldProps) {
  const { name, label, className = '', required = false, compact = false, handleInputChange } = props;

  const isTextarea = props.type === 'textarea';

  const baseWrapper = `flex flex-col gap-1 ${className}`;
  const labelClass = compact ? 'text-xs font-medium text-gray-300 uppercase' : 'text-sm font-medium text-gray-300 mb-1 uppercase';

  const inputBaseClass = 'rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white text-sm';

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
          {...(handleInputChange && { onChange: handleInputChange })}
          required={required}
          className={`${inputBaseClass} p-3 resize-y min-h-[100px]`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={props.type ?? 'text'}
          {...('defaultValue' in props && { defaultValue: props.defaultValue })}
          {...('value' in props && { value: props.value })}
          {...(handleInputChange && { onChange: handleInputChange })}
          required={required}
          className={`${inputBaseClass} p-2`}
        />
      )}
    </div>
  );
}

export default InputField;
