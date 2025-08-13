import React from 'react';
import { IDateInputProps } from '@/types';

const DateInput = ({name, defaultValue, handleInputChange, label, className="", required = false}: IDateInputProps) => {
    const handleDatetimeInputChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        // const inputEl = e.target as HTMLInputElement;
        
        // const now = new Date();
        // const inputValue= new Date(`${inputEl.value}T${now.toISOString().split("T")[1]}`);
        if(handleInputChange)handleInputChange(e);
    };

    const inputProps: Record<string, any> = {
        onChange: handleDatetimeInputChange,
        id: name,
        name: name,
        className: "w-full p-3 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400",
        type: 'date',
        required: required,
    };



    return (
        <div
            className={`flex flex-col gap-1 ${className || ""}`}
        >
            <label
                htmlFor={name}
                className="uppercase text-lg text-gray-300 font-semibold mb-1"
            >
                {label || name}
            </label>
            <input {...inputProps} />
        </div>
    );
};

export default DateInput;

