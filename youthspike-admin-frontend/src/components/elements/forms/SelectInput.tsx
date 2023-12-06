import React, { useEffect, useState } from 'react';
import { ISelectInputProps } from '@/types';

const SelectInput = (props: ISelectInputProps) => {
    const selectStyle: React.CSSProperties = {};
    const [defaultSelected, setDefaultSelected] = useState<string>(props.optionList.length > 0 ? props.optionList[0].value : '');

    useEffect(() => { }, []);

    if (!props.rw) selectStyle.width = '19%';
    return (
        <div className={`input-group mt-4 w-full flex ${props.vertical ? "flex-col" : "flex-row"} justify-between items-center ${props.extraCls}`}>
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
            <select onChange={props.handleSelect} name={props.name} id={props.name} defaultValue={props.defaultValue ? props.defaultValue : defaultSelected}
                className={`form-control ${props.vertical ? 'w-full' : ''} ${props.rw} max-w-full`} style={!props.vertical ? selectStyle : {}} >
                <option value="" defaultChecked>
                    Select an option
                </option>
                {props.optionList.map((o, i) => (
                    <option value={o.value} key={i} className='capitalize bg-gray-500 text-gray-900'>{o.text ? o.text : o.value}</option>
                ))}
            </select>
        </div>
    )
}

export default SelectInput;