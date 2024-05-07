import React, { useEffect } from 'react';
import { ITextInputProps } from '@/types';

const TextareaInput = (props: ITextInputProps) => {
    let dv = '';
    if (props.defaultValue && props.defaultValue !== '') dv = props.defaultValue;

    return (
        <div className={`input-group mt-4 w-full flex ${props.vertical ? 'flex-col' : ''} items-center ${props.extraCls ?? ""}`}>
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw ? props.lw : ''}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
            <textarea onChange={props.handleInputChange}
                readOnly={props.readOnly ?? false}
                id={props.name} name={props.name}
                className={`${props.vertical ? 'w-full' : ''} form-control-textarea  ${props.rw ? props.rw : "w-20"}`}
                defaultValue={dv} required={props.required} />
        </div>
    )
}

export default TextareaInput;