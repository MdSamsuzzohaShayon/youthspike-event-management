import React from 'react';
import { IDateinputProps } from '@/types';
import { defaultInputValue } from '@/utils/datetime';

const DateTimeInput = (props: IDateinputProps) => {
    const handleDatetimeInputChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        
        const inputValue= new Date(`${inputEl.value}`);
        if(props.handleDateChange)props.handleDateChange({ name: props.name, value: inputValue.toISOString() });
    };

    const inputProps: Record<string, any> = {
        onChange: handleDatetimeInputChange,
        id: props.name,
        name: props.name,
        className: "w-full p-3 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400",
        type: 'datetime-local',
        required: props.required,
    };

    // Handle value and defaultValue
    if (props.value !== undefined) {
        // @ts-ignore
        inputProps.value = defaultInputValue(props.value);
    } else if (props.defaultValue !== undefined) {
        inputProps.defaultValue = defaultInputValue(props.defaultValue);
    }

    return (
        <div
            className={`input-group flex flex-col gap-1 ${props.className || ""}`}
        >
            <label
                htmlFor={props.name}
                className="capitalize text-lg font-semibold mb-1"
            >
                {props.label || props.name}
            </label>
            <input {...inputProps} />
        </div>
    );
};

export default DateTimeInput;
