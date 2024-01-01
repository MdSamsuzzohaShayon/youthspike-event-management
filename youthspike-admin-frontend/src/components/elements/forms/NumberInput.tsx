import React from 'react';
import { INumberInputProps } from '@/types';

const NumberInput = (props: INumberInputProps) => {
    // To prevent add undefined text inside a class, instead it will add empty string
    const dv = props.defaultValue ? props.defaultValue : '', lw = props.lw ? props.lw : '', xc = props.extraCls ? props.extraCls : '';
    return (
        <div className={`input-group mt-4 w-full flex ${props.vertical ? "flex-col" : "flew-row"} justify-between items-center ${xc}`}>
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${lw}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
            <input onChange={props.handleInputChange}
                id={props.name} name={props.name}
                className={`form-control ${props.vertical ? 'w-full' : ''} ${props.rw ? props.rw : "w-20"}`}
                type="number"
                defaultValue={dv} required={props.required} />
        </div>
    )
}

export default NumberInput;