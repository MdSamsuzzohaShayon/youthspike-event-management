import React, { useState } from 'react';
import { ITextInputProps } from '@/types';
import Image from 'next/image';

const PasswordInput = (props: ITextInputProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const dv = props.defaultValue ? props.defaultValue : '';

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    }

    return (
        <div className={`input-group mt-4 w-full flex ${props.vertical ? 'flex-col' : 'flex-row'} justify-between items-center ${props.extraCls}`}>
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full mb-2' : ''} ${props.lw}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
            <div className={`relative w-full ${props.vertical ? '' : 'flex items-center'}`}>
                <input
                    onChange={props.handleInputChange}
                    id={props.name}
                    name={props.name}
                    className={`${props.vertical ? 'w-full' : ''} form-control ${props.rw ? props.rw : "w-20"} pr-10`}
                    type={showPassword ? 'text' : 'password'}
                    defaultValue={dv}
                    placeholder={props.placeholder ?? ''}
                    required={props.required}
                />
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-700"
                >
                    {showPassword
                        ? <Image src="/icons/eye-open.svg" alt='show-password' height={20} width={20} />
                        : <Image src="/icons/eye-close.svg" alt='show-password' height={20} width={20} />}
                </button>
            </div>
        </div>
    )
}

export default PasswordInput;
