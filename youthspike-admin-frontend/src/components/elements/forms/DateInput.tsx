import React from 'react';
import { IDateinputProps } from '@/types';

const DateInput = (props: IDateinputProps) => {
    // console.log(props.defaultValue);
    
    return (
        <div className={`input-group mt-4 w-full flex ${props.vertical ? 'flex-col' : ''} justify-between items-center ${props.extraCls}`}>
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
            <input onChange={props.handleInputChange}
                id={props.name} name={props.name}
                className={`${props.vertical ? 'w-full' : ''} form-control ${props.rw ? props.rw : "w-20"}`} type={props.datetime ? 'datetime-local' : 'date'} required={props.required} />
        </div>
    )
}

export default DateInput;