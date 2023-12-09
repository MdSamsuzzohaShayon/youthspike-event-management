import React from 'react';
import { ITextInputProps } from '@/types';

const TextInput = (props: ITextInputProps) => {
    let dv = '';
    if (props.defaultValue && props.defaultValue !== '') dv = props.defaultValue;
    return (
        <div className={`input-group mt-4 w-full flex ${props.vertical ? 'flex-col' : ''} justify-between items-center ${props.extraCls}`}>
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
            <input onChange={props.handleInputChange}
                id={props.name} name={props.name}
                className={`${props.vertical ? 'w-full' : ''} form-control ${props.rw ? props.rw : "w-20"}`} type="text"
                defaultValue={dv} required={props.required} />
        </div>
    )
}

export default TextInput;