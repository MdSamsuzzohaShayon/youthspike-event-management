import React from 'react';
import { IDateinputProps } from '@/types';
import { defaultInputValue } from '@/utils/datetime';

const DateTimeInput = (props: IDateinputProps) => {
    const handleDatetimeInputChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        
        const inputValue= new Date(`${inputEl.value}`);
        props.handleDateChange({ name: props.name, value: inputValue.toISOString() });
    };

    const inputProps: Record<string, any> = {
        onChange: handleDatetimeInputChange,
        id: props.name,
        name: props.name,
        className: `${props.vertical ? 'w-full' : ''} border border-gray-300 bg-transparent outline-none px-2 rounded-lg h-10 text-center datetime-input ${
            props.rw ? props.rw : 'w-20'
        }`,
        type: 'datetime-local',
        required: props.required,
    };

    // Handle value and defaultValue
    if (props.value !== undefined) {
        inputProps.value = defaultInputValue(props.value);
    } else if (props.defaultValue !== undefined) {
        inputProps.defaultValue = defaultInputValue(props.defaultValue);
    }

    return (
        <div
            className={`input-group mt-4 w-full flex ${
                props.vertical ? 'flex-col' : ''
            } justify-between items-center ${props.extraCls}`}
        >
            <label
                htmlFor={props.name}
                className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw}`}
            >
                {props.lblTxt || props.name}
            </label>
            <input {...inputProps} />
        </div>
    );
};

export default DateTimeInput;
