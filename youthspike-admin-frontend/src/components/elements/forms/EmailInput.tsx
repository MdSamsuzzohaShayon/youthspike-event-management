import React from 'react';
import { ITextInputProps } from '@/types';

const EmailInput = (props: ITextInputProps) => {
    const defaultInputVal = props.defaultValue ? props.defaultValue : '' ;
    return (
        <div className={`input-group mt-4 w-full flex justify-between items-center ${props.className}`}>
            <label htmlFor={props.name} className={`capitalize`}>{props.label ? props.label : props.name}</label>
            <input onChange={props.handleInputChange}
                id={props.name} name={props.name}
                className={`border border-gray-300 bg-transparent outline-none px-2 rounded-lg h-10 text-center`} type="email"
                defaultValue={defaultInputVal} required={props.required} />
        </div>
    )
}

export default EmailInput;