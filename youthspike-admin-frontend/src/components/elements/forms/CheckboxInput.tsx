import { ICheckboxInputProps } from '@/types';
import React from 'react';

function CheckboxInput({ name, handleInputChange, _id, defaultValue, extraCls }: ICheckboxInputProps) {
    return (
        <input type="checkbox" name={name} 
        checked={defaultValue ?? false} 
        onChange={(e)=>handleInputChange(e, _id)} 
        id={name} className={`w-4 ${extraCls ?? ""}`} />
    )
}

export default CheckboxInput;