import React from 'react';
import { INumberInputProps } from '@/types';

const NumberInput = (props: INumberInputProps) => {
    return (
        <div className={`input-group mt-4 w-full flex ${props.vertical ? "flex-col" : "flew-row"} justify-between items-center ${props.extraCls}`}>
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full': ''} ${props.lw}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
            <input onChange={props.handleInputChange}
                id={props.name} name={props.name}
                className={`form-control ${props.vertical ? 'w-full': ''} ${props.rw ? props.rw : "w-20"}`} 
                type="number"
                defaultValue={props.defaultValue ? props.defaultValue : ''} required={props.required} />
        </div>
    )
}

export default NumberInput;