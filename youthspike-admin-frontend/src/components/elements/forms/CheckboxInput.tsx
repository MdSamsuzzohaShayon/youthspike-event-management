import { ICheckboxInputProps } from '@/types';
import React from 'react';

function CheckboxInput({ name, handleInputChange, _id, defaultValue, extraCls }: ICheckboxInputProps) {
    const dv = defaultValue ? true : false;
    return (
        <input type="checkbox" name={name} 
        // defaultChecked={dv} 
        onChange={(e)=>handleInputChange(e, _id)} 
        id={name} className={`w-4 ${extraCls && extraCls}`} />
    )
}

export default CheckboxInput;