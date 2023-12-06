import React from 'react';

interface IToggleInputProps {
  widthCls?: number;
  extraCls?: string;
  lblTxt?: string;
  name: string;
  value: boolean;
  handleValueChange: (e: React.SyntheticEvent, stateName: string) => void;
}

const ToggleInput = (props: IToggleInputProps) => {
  return (
    <div className={`input-item mt-4 ${props.extraCls} ${props.widthCls ? props.widthCls : 'w-full'} flex justify-between items-center`}>
      <label htmlFor={props.name} className='capitalize'>{props.lblTxt ? props.lblTxt : props.name}</label>
      <div className={`border border-yellow-500 ${props.value === true ? 'bg-yellow-500' : 'bg-transparent'} outline-none px-2 rounded-full h-10 w-20 text-center flex items-center justify-between`}>
        {props.value && <span>Off</span>}
        <button type="button" className='w-7 h-7 bg-gray-100 rounded-full' onClick={e=>props.handleValueChange(e, props.name)} ></button>
        {!props.value && <span>On</span>}
      </div>
    </div>
  )
}

export default ToggleInput;