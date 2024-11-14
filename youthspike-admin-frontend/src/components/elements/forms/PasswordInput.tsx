import React, { useState } from 'react';
import { IPasswordInputProps } from '@/types';
import Image from 'next/image';

const PasswordInput = (props: IPasswordInputProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const dv = props.defaultValue ? props.defaultValue : '';

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={`input-group mt-4 w-full flex ${props.vertical ? 'flex-col' : 'flex-row'} items-start space-y-2 md:space-y-0 md:items-center ${props.extraCls}`}>
            {/* Label */}
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full mb-2' : ''} ${props.lw}`}>
                {props.lblTxt ? props.lblTxt : props.name}
            </label>

            {/* Input and Tooltip */}
            <div className="relative w-full group">
                <input
                    onChange={props.handleInputChange}
                    id={props.name}
                    name={props.name}
                    className={`${props.vertical ? 'w-full' : ''} form-control ${props.rw ? props.rw : "w-20"} pr-10 py-2 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out`}
                    type={showPassword ? 'text' : 'password'}
                    defaultValue={dv}
                    placeholder={props.placeholder ?? ''}
                    required={props.required}
                />

                {/* Show/Hide Password Button */}
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 hover:text-blue-500 transition-colors"
                >
                    {showPassword
                        ? <Image className={props.svgColor ? props.svgColor : "svg-white"} src="/icons/eye-open.svg" alt="show-password" height={20} width={20} />
                        : <Image className={props.svgColor ? props.svgColor : "svg-white"} src="/icons/eye-close.svg" alt="hide-password" height={20} width={20} />}
                </button>

                {/* Tooltip on Hover */}
                { props.tooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 shadow-lg">
                    {props.tooltip}
                </div>
                )}
            </div>
        </div>
    );
};

export default PasswordInput;
