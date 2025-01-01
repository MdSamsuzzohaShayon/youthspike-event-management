import React from 'react';

interface InputFieldProps {
    name: string;
    type?: string;
    placeholder?: string;
    label?: string;
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
    name,
    type = 'text',
    placeholder = '',
    label,
    value,
    onChange,
    className = '',
    required = false,
}) => {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label htmlFor={name} className="text-sm font-medium text-gray-300">
                    {label}
                </label>
            )}
            <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full p-3 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
        </div>
    );
};

export default InputField;
