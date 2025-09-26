import { ICheckboxInputProps } from '@/types';
import React from 'react';

function CheckboxInput({ name, handleInputChange, _id, defaultValue, className }: ICheckboxInputProps) {
    return (
        <input type="checkbox" name={name} 
        defaultChecked={defaultValue ?? false} 
        onChange={(e)=>handleInputChange(e, _id)} 
        id={name} className={`w-4 ${className ?? ""}`} />
    )
}

export default CheckboxInput;