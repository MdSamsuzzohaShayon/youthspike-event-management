import { ICheckboxInputProps } from '@/types';
import React, { useMemo } from 'react';

function CheckboxInput({ name, handleInputChange, _id, defaultValue, className }: ICheckboxInputProps) {
    const id = useMemo(() => {
        const random = Math.floor(Math.random() * 1000000); // random 6-digit number
        return `${name}-${random}`;
      }, [name]);
      
    return (
        <input type="checkbox" name={name} 
        defaultChecked={defaultValue ?? false} 
        onChange={(e)=>handleInputChange(e, _id)} 
        id={id} className={`w-4 ${className ?? ""}`} />
    )
}

export default CheckboxInput;