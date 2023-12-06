import React from 'react';
import { ITextInputProps } from '@/types';

const PasswordInput = (props: ITextInputProps) => {
    return (
        <div className={`input-group mt-4 w-full flex ${props.vertical ? 'flex-col' : ''} justify-between items-center ${props.extraCls}`}>
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full': ''} ${props.lw}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
            <input onChange={props.handleInputChange}
                id={props.name} name={props.name}
                className={`${props.vertical ? 'w-full': ''} form-control ${props.rw ? props.rw : "w-20"}`} type="password"
                defaultValue={props.defaultValue} required={props.required} />
        </div>
    )
}

export default PasswordInput;